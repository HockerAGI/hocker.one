import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
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

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// ==========================
// HELPERS
// ==========================
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

// ==========================
// TYPES
// ==========================
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

// ==========================
// GET
// ==========================
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    const project_id = String(
      url.searchParams.get("project_id") ??
        url.searchParams.get("projectId") ??
        ""
    ).trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
      "viewer",
    ]);

    const { data, error } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new ApiError(500, {
        error: "No se pudo leer la cola de comandos.",
      });
    }

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.payload, apiErr.status);
  }
}

// ==========================
// POST
// ==========================
export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Ingreso_Orden_Tactica",
    metadata: { endpoint: "/api/commands" },
  });

  try {
    const body = await parseBody(req);

    const project_id = String(
      body.project_id ?? body.projectId ?? ""
    ).trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    // ==========================
    // VALIDACIÓN ZOD (CORE FIX)
    // ==========================
    const parsed = commandSchema.parse(body);

    const command = parsed.command;
    const node_id = normalizeNodeId(parsed.node_id);
    const payload = asJsonObject(parsed.payload);

    // ==========================
    // CONTEXTO
    // ==========================
    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
    ]);

    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, {
        error: "SISTEMA BLOQUEADO: Kill Switch activo.",
      });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, {
        error: "MODO SEGURO: solo lectura.",
      });
    }

    // ==========================
    // FLAGS
    // ==========================
    const needsApproval = asBool(
      body.needs_approval ?? body.needsApproval,
      false
    );

    // ==========================
    // SEGURIDAD
    // ==========================
    const secret = String(
      process.env.COMMAND_HMAC_SECRET ?? ""
    ).trim();

    if (!secret) {
      throw new ApiError(500, {
        error: "COMMAND_HMAC_SECRET no está configurado en el entorno.",
      });
    }

    // ==========================
    // CREACIÓN
    // ==========================
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
      created_at
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

    // ==========================
    // DB INSERT
    // ==========================
    const { data, error } = await ctx.sb
      .from("commands")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: error.message });
    }

    // ==========================
    // TRIGGER
    // ==========================
    if (!needsApproval) {
      await tasks.trigger("hocker-core-executor", {
        commandId: id,
        projectId: ctx.project_id,
      });
    }

    // ==========================
    // TRACKING
    // ==========================
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
