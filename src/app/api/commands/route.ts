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
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

type CommandStatus = "queued" | "needs_approval";

type CommandInsertRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: JsonObject;
  status: CommandStatus;
  needs_approval: boolean;
  signature: string;
  result: JsonObject | null;
  error: string | null;
  approved_at: string | null;
  executed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

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

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Ingreso_Orden_Tactica",
    metadata: { endpoint: "/api/commands" },
  });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "hocker-one").trim();
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "SISTEMA BLOQUEADO: Kill Switch activo." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: el sistema está en solo lectura." });
    }

    const command = String(body.command ?? "").trim();
    if (!command) {
      throw new ApiError(400, { error: "El comando no puede venir vacío." });
    }

    const rawNodeId = String(body.node_id ?? "hocker-fabric");
    const node_id = normalizeNodeId(rawNodeId);
    const payload = asJsonObject(body.payload);
    const needsApproval = asBool(body.needs_approval, false);
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    const secret = String(process.env.COMMAND_HMAC_SECRET ?? "").trim();
    if (!secret) {
      throw new ApiError(500, { error: "COMMAND_HMAC_SECRET no está configurado en el entorno." });
    }

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

    const row: CommandInsertRow = {
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

    if (error) {
      throw new ApiError(500, { error: "Falla de sincronización en la Matriz." });
    }

    if (!needsApproval) {
      await tasks.trigger("hocker-core-executor", { commandId: id });
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
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}