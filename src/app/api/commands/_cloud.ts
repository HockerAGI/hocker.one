import { createAdminSupabase } from "@/lib/supabase-admin";
import { verifyCommandSignature } from "@/lib/security";

// Perímetros de seguridad
const READONLY_COMMANDS = new Set(["ping", "status"]);
const WRITE_COMMANDS = new Set(["shell.exec", "fs.write", "run_sql", "stripe.charge", "meta.send_msg"]);

// Identificación del tipo de agente
export function isCloudNode(node_id: string) {
  const nid = String(node_id || "").trim();
  return nid === "hocker-fabric" || nid.startsWith("cloud-") || nid.startsWith("trigger-");
}

// Lectura de nivel administrador para los protocolos
export async function getControlsAdmin(sb: any, project_id: string) {
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

// Transmisor de Memoria: Envía señales que tu 'EventsFeed' captura en vivo
export async function emit(sb: any, project_id: string, level: "info" | "warn" | "error" | "critical", type: string, message: string, data?: any) {
  await sb.from("events").insert({
    project_id,
    node_id: "hocker-fabric",
    level,
    type,
    message,
    data: data && typeof data === "object" ? data : { log_info: data },
  });
}

export async function claim(sb: any, project_id: string, id: string) {
  const { data, error } = await sb
    .from("commands")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();

  return !error && data?.id;
}

export async function done(sb: any, project_id: string, id: string, result: any) {
  await sb
    .from("commands")
    .update({ status: "done", result, finished_at: new Date().toISOString() })
    .eq("id", id);
}

export async function fail(sb: any, project_id: string, id: string, errorMsg: string) {
  await sb
    .from("commands")
    .update({ status: "error", error: errorMsg, finished_at: new Date().toISOString() })
    .eq("id", id);
}

// Lógica de simulación o ejecución de nube real
function executeLocalCloud(command: string, payload: any) {
  // Aquí es donde en el futuro conectarás las verdaderas APIs (Stripe, Meta, etc)
  return { status: "success", executed: true, note: `Simulación de ejecución en nube para comando: ${command}` };
}

// El Orquestador Principal de la Nube
export async function processCloudQueue(sb: any, project_id: string, secret: string) {
  const controls = await getControlsAdmin(sb, project_id);
  if (controls.kill_switch) return { aborted: true, reason: "kill_switch" };

  const { data: queue } = await sb
    .from("commands")
    .select("*")
    .eq("project_id", project_id)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(10);

  if (!queue || queue.length === 0) return { dispatched: 0 };

  let dispatched = 0;
  const results = [];

  for (const cmd of queue) {
    if (!isCloudNode(cmd.node_id)) continue;

    const claimed = await claim(sb, project_id, cmd.id);
    if (!claimed) continue;

    const command = String(cmd.command || "").trim().toLowerCase();
    const payload = cmd.payload ?? {};

    // allow_write OFF => bloquea comandos de escritura en la nube
    if (!controls.allow_write && (WRITE_COMMANDS.has(command) || !READONLY_COMMANDS.has(command))) {
      await fail(sb, project_id, cmd.id, "Operación bloqueada: allow_write apagado.");
      await emit(sb, project_id, "warn", "cloud.exec.blocked", `Bloqueo de escritura: ${command}`, { command_id: cmd.id });
      results.push({ id: cmd.id, status: "error", reason: "allow_write_off" });
      continue;
    }

    // Zero-Trust: Verificación de firma criptográfica
    if (secret) {
      const okSig = verifyCommandSignature(secret, cmd.signature, cmd.id, cmd.project_id, cmd.node_id, cmd.command, cmd.payload, cmd.created_at);
      if (!okSig) {
        await fail(sb, project_id, cmd.id, "Firma digital inválida (Posible manipulación).");
        await emit(sb, project_id, "critical", "cloud.exec.security", `Intento de inyección no firmado para: ${command}`, { command_id: cmd.id });
        results.push({ id: cmd.id, status: "error", reason: "invalid_signature" });
        continue;
      }
    }

    try {
      await emit(sb, project_id, "info", "cloud.exec.start", `Iniciando ejecución remota: ${command}`, { command_id: cmd.id, node: cmd.node_id });

      const out = executeLocalCloud(command, payload);
      await done(sb, project_id, cmd.id, out);

      await emit(sb, project_id, "info", "cloud.exec.done", `Orden ejecutada con éxito: ${command}`, { command_id: cmd.id, result: out });
      results.push({ id: cmd.id, status: "done" });
      dispatched++;
    } catch (e: any) {
      const msg = String(e?.message || e || "Error desconocido en motor de nube.");
      await fail(sb, project_id, cmd.id, msg);
      await emit(sb, project_id, "error", "cloud.exec.fail", `Falla de ejecución: ${command}`, { command_id: cmd.id, error: msg });
      results.push({ id: cmd.id, status: "error", reason: msg });
    }
  }

  return { dispatched, results };
}
