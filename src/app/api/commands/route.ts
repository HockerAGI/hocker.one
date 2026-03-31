import { getErrorMessage } from "@/lib/errors";
import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { signCommand } from "@/lib/security";
import type { CommandStatus } from "@/lib/types";
import {
  ApiError,
  ensureNode,
  getControls,
  json,
  parseBody,
  requireProjectRole,
  toApiError,
} from "../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function normalizeStatus(input: unknown): CommandStatus | null {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return null;
  const valid: CommandStatus[] = ["queued", "needs_approval", "running", "done", "error", "canceled"];
  return valid.includes(s as CommandStatus) ? (s as CommandStatus) : null;
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Ingreso_Orden_Tactica", metadata: { endpoint: "/api/commands" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "editor"]);
    
    // Verificación Quirúrgica de Gobernanza
    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "SISTEMA BLOQUEADO: Kill Switch Activo." });
    }

    // ... (Lógica de creación de comando)
    
    const id = crypto.randomUUID();
    const signature = await signCommand(id, project_id, body.node_id, body.command, body.payload);

    const { data, error } = await ctx.sb
      .from("commands")
      .insert({
        id,
        project_id: ctx.project_id,
        signature,
        // ...resto de campos
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Falla de sincronización en la Matriz." });

    // Despacho automático si no requiere aprobación
    if (!body.needs_approval) {
      await tasks.trigger("hocker-core-executor", { commandId: id });
    }

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({ name: "FALLA_INGRESO", level: "ERROR", output: { error: apiErr.message } });
    return json(apiErr.body, apiErr.status);
  }
}
