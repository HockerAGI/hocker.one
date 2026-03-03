import { createAdminSupabase } from "@/lib/supabase-admin";
import { verifyCommandSignature } from "@/lib/security";

const READONLY_COMMANDS = new Set(["ping", "status"]);
const WRITE_COMMANDS = new Set(["shell.exec", "fs.write", "run_sql", "stripe.charge", "meta.send_msg"]);

export function isCloudNode(node_id: string) {
  const nid = String(node_id || "").trim();
  return nid === "hocker-fabric" || nid.startsWith("cloud-") || nid.startsWith("trigger-");
}

async function getControlsAdmin(sb: any, project_id: string) {
  const { data } = await sb
    .from("system_controls")
    .select("kill_switch,allow_write")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  return {
    kill_switch: Boolean((data as any)?.kill_switch),
    allow_write: Boolean((data as any)?.allow_write),
  };
}

async function emit(sb: any, project_id: string, level: "info" | "warn" | "error", type: string, message: string, data?: any) {
  await sb.from("events").insert({
    project_id,
    node_id: "hocker-fabric",
    level,
    type,
    message,
    data: data && typeof data === "object" ? data : {},
  });
}

async function claim(sb: any, project_id: string, id: string) {
  const started_at = new Date().toISOString();
  const { data } = await sb
    .from("commands")
    .update({ status: "running", started_at })
    .eq("project_id", project_id)
    .eq("id", id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  return data as any;
}

async function done(sb: any, project_id: string, id: string, result: any) {
  const ts = new Date().toISOString();
  await sb
    .from("commands")
    .update({ status: "done", executed_at: ts, finished_at: ts, result: result ?? {}, error: null })
    .eq("project_id", project_id)
    .eq("id", id);
}

async function fail(sb: any, project_id: string, id: string, msg: string) {
  const ts = new Date().toISOString();
  await sb
    .from("commands")
    .update({ status: "error", executed_at: ts, finished_at: ts, result: null, error: msg })
    .eq("project_id", project_id)
    .eq("id", id);
}

async function cancel(sb: any, project_id: string, id: string, msg: string) {
  const ts = new Date().toISOString();
  await sb
    .from("commands")
    .update({ status: "canceled", executed_at: ts, finished_at: ts, result: null, error: msg })
    .eq("project_id", project_id)
    .eq("id", id);
}

function executeLocalCloud(command: string) {
  if (command === "ping") return { ok: true, pong: true, ts: new Date().toISOString() };
  if (command === "status") {
    return {
      ok: true,
      node_id: "hocker-fabric",
      env: process.env.VERCEL ? "vercel" : "node",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ts: new Date().toISOString(),
    };
  }
  throw new Error("cloud_executor_no_handler");
}

export async function dispatchCloudCommands(project_id: string, limit = 10) {
  const sb = createAdminSupabase();
  const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
  if (!secret) throw new Error("Falta COMMAND_HMAC_SECRET");

  const controls = await getControlsAdmin(sb, project_id);

  const { data: cmds, error } = await sb
    .from("commands")
    .select("*")
    .eq("project_id", project_id)
    .eq("status", "queued")
    .eq("needs_approval", false)
    .or("node_id.eq.hocker-fabric,node_id.like.cloud-%,node_id.like.trigger-%")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  const results: any[] = [];
  let dispatched = 0;

  for (const raw of (cmds as any[]) || []) {
    if (!isCloudNode(raw.node_id)) continue;

    if (controls.kill_switch) {
      await cancel(sb, project_id, raw.id, "Kill Switch ON (cloud executor).");
      results.push({ id: raw.id, status: "canceled", reason: "kill_switch" });
      continue;
    }

    const cmd = await claim(sb, project_id, raw.id);
    if (!cmd?.id) continue;

    const command = String(cmd.command || "").trim();
    const payload = cmd.payload ?? {};

    // allow_write OFF => bloquea comandos de escritura
    if (!controls.allow_write && (WRITE_COMMANDS.has(command) || !READONLY_COMMANDS.has(command))) {
      await fail(sb, project_id, cmd.id, "allow_write_off (cloud executor)");
      results.push({ id: cmd.id, status: "error", reason: "allow_write_off" });
      continue;
    }

    // Zero-Trust: verificar firma
    const okSig = verifyCommandSignature(secret, cmd.signature, cmd.id, cmd.project_id, cmd.node_id, cmd.command, cmd.payload, cmd.created_at);
    if (!okSig) {
      await fail(sb, project_id, cmd.id, "invalid_signature");
      results.push({ id: cmd.id, status: "error", reason: "invalid_signature" });
      continue;
    }

    try {
      await emit(sb, project_id, "info", "cloud.exec.start", `Cloud executing: ${command}`, { command_id: cmd.id });

      const out = executeLocalCloud(command);
      await done(sb, project_id, cmd.id, out);

      await emit(sb, project_id, "info", "cloud.exec.done", `Cloud done: ${command}`, { command_id: cmd.id });
      results.push({ id: cmd.id, status: "done" });
      dispatched++;
    } catch (e: any) {
      const msg = String(e?.message || e || "cloud_exec_error");
      await fail(sb, project_id, cmd.id, msg);

      await emit(sb, project_id, "error", "cloud.exec.error", `Cloud error: ${command}`, { command_id: cmd.id, error: msg });
      results.push({ id: cmd.id, status: "error", reason: msg });
    }
  }

  return { dispatched, results };
}