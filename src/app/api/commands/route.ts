import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { getLangfuse } from "@/lib/langfuse-safe";
import { auditTrailEvent } from "@/lib/audit-chain";
import { defaultNodeId, normalizeNodeId } from "@/lib/project";
import { signCommand } from "@/lib/security";
import type { JsonObject, CommandRow } from "@/lib/types";
import { commandSchema } from "@/lib/validators";
import {
  ApiError,
  ensureNode,
  getControls,
  json,
  parseBody,
  requireProjectRole,
  toApiError,
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = getLangfuse();

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function isCloudNode(nodeId: string): boolean {
  return nodeId.startsWith("cloud-");
}

type CommandInsert = Pick<
  CommandRow,
  | "id"
  | "project_id"
  | "node_id"
  | "command"
  | "payload"
  | "status"
  | "needs_approval"
  | "signature"
  | "result"
  | "error"
  | "approved_at"
  | "executed_at"
  | "started_at"
  | "finished_at"
  | "created_at"
>;

async function triggerCloudExecutor(baseUrl: string, internalSecret: string) {
  const res = await fetch(`${baseUrl}/api/orchestrator/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${internalSecret}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`No se pudo disparar el orquestador cloud: HTTP ${res.status}`);
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") ?? url.searchParams.get("projectId") ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new ApiError(500, { error: "No se pudo leer la cola de comandos." });
    }

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.payload, apiErr.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Ingreso_Orden_Tactica",
    metadata: { endpoint: "/api/commands" },
  });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const parsed = commandSchema.parse({
      command: body.command,
      node_id: body.node_id || defaultNodeId,
      payload: body.payload ?? {},
    });

    const command = parsed.command;
    const node_id = normalizeNodeId(parsed.node_id || defaultNodeId);
    const payload = asJsonObject(parsed.payload);

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "SISTEMA BLOQUEADO: Kill Switch activo." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: solo lectura." });
    }

    const needsApproval = asBool(body.needs_approval ?? body.needsApproval, false);

    const secret = String(
      process.env.HOCKER_COMMAND_HMAC_SECRET ??
      process.env.COMMAND_HMAC_SECRET ??
      "",
    ).trim();

    if (!secret) {
      throw new ApiError(500, {
        error: "HOCKER_COMMAND_HMAC_SECRET / COMMAND_HMAC_SECRET no está configurado.",
      });
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    await ensureNode(ctx.sb, ctx.project_id, node_id);

    const signature = signCommand(
      secret,
      id,
      ctx.project_id,
      node_id,
      command,
      payload,
      created_at,
    );

    const row: CommandInsert = {
      id,
      project_id: ctx.project_id,
      node_id,
      command,
      payload,
      status: needsApproval ? "needs_approval" : "queued",
      needs_approval: needsApproval,
      signature,
      result: null,
      error: null,
      approved_at: null,
      executed_at: null,
      started_at: null,
      finished_at: null,
      created_at,
    };

    const { data, error } = await ctx.sb.from("commands").insert(row).select("*").single();

    if (error || !data) {
      throw new ApiError(500, { error: error?.message ?? "No se pudo registrar la orden." });
    }

    await ctx.sb.from("events").insert({
      project_id: ctx.project_id,
      node_id,
      level: "info",
      type: "command.created",
      message: `Command ${command} registrada para ${node_id}`,
      data: {
        command_id: id,
        command,
        needs_approval: needsApproval,
        node_id,
      },
    });

    await auditTrailEvent({
      project_id: ctx.project_id,
      event_type: "command.created",
      entity_type: "command",
      entity_id: id,
      actor_type: "user",
      actor_id: ctx.user.id,
      role: ctx.role,
      action: "create_command",
      severity: "info",
      payload: {
        node_id,
        command,
        needs_approval: needsApproval,
      },
    });

    if (!needsApproval) {
      if (isCloudNode(node_id)) {
        const baseUrl = new URL(req.url).origin.replace(/\/+$/, "");
        const internalSecret = String(
          process.env.HOCKER_ONE_INTERNAL_TOKEN ??
          process.env.CRON_SECRET ??
          "",
        ).trim();

        if (!internalSecret) {
          throw new ApiError(500, {
            error: "HOCKER_ONE_INTERNAL_TOKEN / CRON_SECRET no configurado para despachar cloud.",
          });
        }

        await triggerCloudExecutor(baseUrl, internalSecret);
      } else {
        try {
          await tasks.trigger("hocker-core-executor", {
            commandId: id,
            projectId: ctx.project_id,
          });
        } catch {
          // el agente físico seguirá haciendo polling
        }
      }
    }

    trace.event({
      name: "ORDEN_INGRESADA",
      input: { commandId: id, node_id, needsApproval },
    });

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const apiErr = toApiError(err);

    trace.event({
      name: "FALLA_INGRESO",
      level: "ERROR",
      output: { error: apiErr.payload },
    });

    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}