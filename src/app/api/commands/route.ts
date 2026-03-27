import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { signCommand } from "@/lib/security";
import type { CommandStatus } from "@/lib/types";
import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, parseQuery, toApiError } from "../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const READONLY_COMMANDS = new Set(["ping", "status", "read_dir", "read_file_head"]);
const SENSITIVE_COMMANDS = new Set(["run_sql", "shell.exec", "fs.write", "stripe.charge", "meta.send_msg"]);

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Commands_GET_Polling", metadata: { runtime: "Vercel" } });
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const id = q.get("id");
    const node_id = q.get("node_id");
    const status = q.get("status");

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    let query = ctx.sb.from("commands").select("*").eq("project_id", ctx.project_id).order("created_at", { ascending: false }).limit(100);

    if (id) query = query.eq("id", id);
    if (node_id) query = query.eq("node_id", node_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new ApiError(400, { error: error.message });

    trace.event({ name: "SUCCESS" });
    await langfuse.flushAsync();

    return json({ ok: true, items: data ?? [] }, 200);
  } catch (e: any) {
    trace.event({ name: "ERROR", input: { error: e.message } });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Commands_POST_Execute", metadata: { endpoint: "/api/commands" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const node_id = String(body.node_id ?? "").trim();
    const command = String(body.command ?? "").trim();
    const payload = body.payload ?? {};

    trace.update({ tags: [project_id, command] });

    if (!node_id) throw new ApiError(400, { error: "Falta node_id." });
    if (!command) throw new ApiError(400, { error: "Falta command." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    await ensureNode(ctx.sb, ctx.project_id, node_id);

    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "VERTX SECURITY: Kill Switch ON. Operaciones bloqueadas." });
    }

    if (!controls.allow_write && !READONLY_COMMANDS.has(command)) {
      throw new ApiError(423, { error: "Modo lectura activo. Activa escritura en Seguridad." });
    }

    const needs_approval = SENSITIVE_COMMANDS.has(command);
    const status: CommandStatus = needs_approval ? "needs_approval" : "queued";

    const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) throw new ApiError(500, { error: "VERTX SECURITY: Falta COMMAND_HMAC_SECRET." });

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const signature = signCommand(secret, id, ctx.project_id, node_id, command, payload, created_at);

    const { data, error } = await ctx.sb
      .from("commands")
      .insert({ id, project_id: ctx.project_id, node_id, command, payload, status, needs_approval, signature, created_at })
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    const isCloudNode = node_id.startsWith("cloud-") || node_id === "hocker-fabric" || node_id.startsWith("trigger-");

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
          trace.event({ name: "TriggerDev_Dispatched", input: { id, command } });
        } catch (triggerError: any) {
          trace.event({ name: "TriggerDev_Fallback", input: { error: triggerError.message } });
        }
      } else {
        trace.event({ name: "PhysicalNode_Queued", input: { id, node_id } });
      }
    }

    trace.event({ name: "SUCCESS" });
    await langfuse.flushAsync();

    return json({ ok: true, item: data }, 201);
  } catch (e: any) {
    trace.event({ name: "ERROR", input: { error: e.message } });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}