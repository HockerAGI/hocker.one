import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
import { signCommand } from "@/lib/security";
import { normalizeNodeId } from "@/lib/project";
import type { JsonObject } from "@/lib/types";
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

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

function isJsonObject(value: unknown): value is JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Ingreso_Orden_Tactica", metadata: { endpoint: "/api/commands" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const controls: { kill_switch?: boolean; allow_write?: boolean; [key: string]: unknown } = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "SISTEMA BLOQUEADO: Kill Switch Activo." });
    }
    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: El sistema está en solo lectura." });
    }

    const command = String(body.command ?? "").trim();
    if (!command) {
      throw new ApiError(400, { error: "El comando no puede venir vacío." });
    }

    const nodeId = normalizeNodeId(String(body.node_id ?? "hocker-fabric"));
    const payload = isJsonObject(body.payload) ? body.payload : {};
    const needsApproval = toBool(body.needs_approval, false);
    const created_at = new Date().toISOString();
    const id = crypto.randomUUID();
    const secret = String(process.env.COMMAND_HMAC_SECRET ?? "").trim();

    if (!secret) {
      throw new ApiError(500, { error: "COMMAND_HMAC_SECRET no está configurado en el entorno." });
    }

    await ensureNode(ctx.sb, ctx.project_id, nodeId);

    const signature = signCommand(
      secret,
      id,
      ctx.project_id,
      nodeId,
      command,
      payload,
      created_at,
    );

    const row = {
      id,
      project_id: ctx.project_id,
      node_id: nodeId,
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

    if (error) throw new ApiError(500, { error: "Falla de sincronización en la Matriz." });

    if (!needsApproval) {
      await tasks.trigger("hocker-core-executor", { commandId: id });
    }

    trace.event({
      name: "ORDEN_INGRESADA",
      input: { commandId: id, needsApproval, nodeId },
    });

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({ name: "FALLA_INGRESO", level: "ERROR", output: { error: apiErr.message } });
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}