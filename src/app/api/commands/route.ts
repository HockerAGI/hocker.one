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
  parseQuery,
  toApiError,
} from "../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const READONLY_COMMANDS = new Set(["ping", "status", "read_dir", "read_file_head"]);
const SENSITIVE_COMMANDS = new Set(["run_sql", "shell.exec", "fs.write", "stripe.charge", "meta.send_msg"]);

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function normalizeStatus(input: any): CommandStatus | null {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "canceled") return "canceled";
  if (
    s === "queued" ||
    s === "needs_approval" ||
    s === "running" ||
    s === "done" ||
    s === "error" ||
    s === "failed" ||
    s === "canceled"
  ) {
    return s as CommandStatus;
  }
  return null;
}

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Radar_Comandos_Lectura", metadata: { endpoint: "/api/commands" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const id = q.get("id");
    const node_id = q.get("node_id");
    const status = normalizeStatus(q.get("status"));

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "auditoria"] });

    let query = ctx.sb.from("commands").select("*").eq("project_id", ctx.project_id);
    if (id) query = query.eq("id", id);
    if (node_id) query = query.eq("node_id", node_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
    if (error) throw new ApiError(500, { error: "Falla al escanear la memoria de comandos." });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, items: data });
  } catch (e: any) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_LECTURA", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Inyeccion_Comando", metadata: { endpoint: "/api/commands" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const node_id = String(body.node_id ?? "hocker-fabric").trim();
    const command = String(body.command ?? "").trim().toLowerCase();
    const payload = body.payload ?? {};

    if (!command) throw new ApiError(400, { error: "Se requiere especificar una orden operativa." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, command, node_id] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO GENERAL: Kill Switch Activo. Imposible crear nuevas órdenes." });
    }

    const isWrite = !READONLY_COMMANDS.has(command);
    if (isWrite && !controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: Creación denegada. El panel está en solo lectura." });
    }

    await ensureNode(ctx.sb, ctx.project_id, node_id);

    const needs_approval = SENSITIVE_COMMANDS.has(command);
    const status: CommandStatus = needs_approval ? "needs_approval" : "queued";

    const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) {
      throw new ApiError(500, { error: "Falla Crítica: Llave criptográfica (HMAC) no detectada en el servidor." });
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const signature = signCommand(secret, id, ctx.project_id, node_id, command, payload, created_at);

    const { data, error } = await ctx.sb
      .from("commands")
      .insert({
        id,
        project_id: ctx.project_id,
        node_id,
        command,
        payload,
        status,
        needs_approval,
        signature,
        created_at,
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Falla de red al intentar registrar la orden en la matriz." });

    const isCloudNode =
      node_id.startsWith("cloud-") || node_id === "hocker-fabric" || node_id.startsWith("trigger-");

    if (!needs_approval) {
      if (isCloudNode) {
        try {
          await tasks.trigger("hocker-core-executor", {
            commandId: id,
            nodeId: node_id,
            command,
            payload,
            projectId: ctx.project_id,
          });
          trace.event({ name: "Disparo_Directo_A_Nube", input: { id, command } });
        } catch (triggerError: any) {
          trace.event({ name: "Falla_Motor_Remoto", input: { error: triggerError.message } });
        }
      } else {
        trace.event({ name: "En_Espera_Para_Agente_Fisico", input: { id, node_id } });
      }
    } else {
      trace.event({ name: "Retenido_Para_Aprobacion_Manual", input: { id, command } });
    }

    trace.event({ name: "OPERACION_EXITOSA" });
    return json({ ok: true, item: data }, 201);
  } catch (e: any) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_INYECCION", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}