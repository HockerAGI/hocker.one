import { promisify } from "node:util";
import { exec as execCb } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { verifyCommandSignature } from "@/lib/security";

const exec = promisify(execCb);

const READONLY_COMMANDS = new Set(["ping", "status", "read_dir", "read_file_head"]);
const WRITE_COMMANDS = new Set(["shell.exec", "fs.write", "run_sql", "stripe.charge", "meta.send_msg"]);

export type CloudQueueOptions = {
  commandId?: string;
  nodeId?: string;
};

export type CloudExecResult = {
  command: string;
  ok: boolean;
  note?: string;
  data?: any;
  stdout?: string;
  stderr?: string;
  code?: number | null;
};

function nowIso() {
  return new Date().toISOString();
}

function getWorkspaceRoot() {
  const configured = String(process.env.HOCKER_WORKSPACE_ROOT || process.env.WORKSPACE_ROOT || "").trim();
  return path.resolve(configured || process.cwd());
}

function resolveSandboxPath(requestedPath: string) {
  const root = getWorkspaceRoot();
  const safeInput = String(requestedPath ?? "").replace(/^~(?=$|\/|\\)/, root);
  const resolved = path.resolve(root, safeInput);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error("Ruta fuera del sandbox permitido.");
  }

  return resolved;
}

function safeJson(input: any) {
  return input && typeof input === "object" ? input : {};
}

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
export async function emit(
  sb: any,
  project_id: string,
  level: "info" | "warn" | "error" | "critical",
  type: string,
  message: string,
  data?: any
) {
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
  const started_at = nowIso();
  const { data, error } = await sb
    .from("commands")
    .update({ status: "running", started_at, updated_at: started_at })
    .eq("project_id", project_id)
    .eq("id", id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();

  return !error && data?.id;
}

export async function done(sb: any, project_id: string, id: string, result: any) {
  const finished_at = nowIso();
  await sb
    .from("commands")
    .update({
      status: "done",
      result,
      executed_at: finished_at,
      finished_at,
      updated_at: finished_at,
      error: null,
    })
    .eq("project_id", project_id)
    .eq("id", id);
}

export async function fail(sb: any, project_id: string, id: string, errorMsg: string) {
  const finished_at = nowIso();
  await sb
    .from("commands")
    .update({
      status: "error",
      error: errorMsg,
      executed_at: finished_at,
      finished_at,
      updated_at: finished_at,
    })
    .eq("project_id", project_id)
    .eq("id", id);
}

async function executeLocalCloud(command: string, payload: any): Promise<CloudExecResult> {
  const root = getWorkspaceRoot();
  const body = safeJson(payload);

  switch (command) {
    case "ping":
      return {
        command,
        ok: true,
        note: "Nodo en línea.",
        data: {
          pong: true,
          workspace_root: root,
          platform: process.platform,
          node_version: process.version,
          timestamp: nowIso(),
        },
      };

    case "status": {
      return {
        command,
        ok: true,
        note: "Estado del nodo recuperado.",
        data: {
          workspace_root: root,
          uptime_seconds: Math.floor(process.uptime()),
          memory: process.memoryUsage(),
          env: {
            allow_shell_exec: process.env.ALLOW_CLOUD_SHELL_EXEC === "1",
            allow_fs_write: process.env.ALLOW_CLOUD_FS_WRITE === "1",
            allow_sql_adapter: Boolean(process.env.CLOUD_SQL_ADAPTER),
            allow_stripe_adapter: Boolean(process.env.STRIPE_SECRET_KEY),
            allow_meta_adapter: Boolean(process.env.META_ACCESS_TOKEN),
          },
        },
      };
    }

    case "read_dir": {
      const target = resolveSandboxPath(String(body.path ?? "."));
      const entries = await fs.readdir(target, { withFileTypes: true });
      return {
        command,
        ok: true,
        note: "Directorio leído correctamente.",
        data: {
          path: target,
          entries: entries.map((entry) => ({
            name: entry.name,
            kind: entry.isDirectory() ? "dir" : entry.isSymbolicLink() ? "link" : "file",
          })),
        },
      };
    }

    case "read_file_head": {
      const target = resolveSandboxPath(String(body.path ?? ""));
      const limit = Math.max(1, Math.min(200, Number(body.lines ?? body.limit ?? 40)));
      const content = await fs.readFile(target, "utf8");
      const lines = content.split(/\r?\n/);
      return {
        command,
        ok: true,
        note: "Archivo leído correctamente.",
        data: {
          path: target,
          lines: lines.slice(0, limit),
          truncated: lines.length > limit,
          total_lines: lines.length,
        },
      };
    }

    case "shell.exec": {
      if (process.env.ALLOW_CLOUD_SHELL_EXEC !== "1") {
        throw new Error("Ejecución de shell deshabilitada por política del entorno.");
      }

      const commandLine = String(body.commandLine ?? body.cmd ?? body.command ?? "").trim();
      if (!commandLine) throw new Error("Falta commandLine para ejecutar la shell.");

      const cwd = body.cwd ? resolveSandboxPath(String(body.cwd)) : root;
      const timeout = Math.max(1000, Math.min(120000, Number(body.timeout ?? 30000)));
      const { stdout, stderr } = await exec(commandLine, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          HOCKER_WORKSPACE_ROOT: root,
        },
      });

      return {
        command,
        ok: true,
        note: "Shell ejecutada con éxito.",
        stdout,
        stderr,
        data: { cwd, timeout },
      };
    }

    case "fs.write": {
      if (process.env.ALLOW_CLOUD_FS_WRITE !== "1") {
        throw new Error("Escritura en filesystem deshabilitada por política del entorno.");
      }

      const target = resolveSandboxPath(String(body.path ?? ""));
      const content = String(body.content ?? "");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, "utf8");
      return {
        command,
        ok: true,
        note: "Archivo escrito correctamente.",
        data: { path: target, bytes: Buffer.byteLength(content, "utf8") },
      };
    }

    case "run_sql":
      throw new Error("Adaptador SQL no configurado en este nodo.");

    case "stripe.charge":
      throw new Error("Adaptador Stripe no configurado en este nodo.");

    case "meta.send_msg":
      throw new Error("Adaptador de mensajería Meta no configurado en este nodo.");

    default:
      throw new Error(`Comando no soportado en ejecución local: ${command}`);
  }
}

async function loadCommandQueue(sb: any, project_id: string, options: CloudQueueOptions) {
  if (options.commandId) {
    const { data } = await sb
      .from("commands")
      .select("*")
      .eq("project_id", project_id)
      .eq("id", options.commandId)
      .maybeSingle();

    if (!data) return [];
    return [data];
  }

  let query = sb
    .from("commands")
    .select("*")
    .eq("project_id", project_id)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(10);

  if (options.nodeId) {
    query = query.eq("node_id", options.nodeId);
  }

  const { data } = await query;
  return Array.isArray(data) ? data : [];
}

// El Orquestador Principal de la Nube
export async function processCloudQueue(
  sb: any,
  project_id: string,
  secret: string,
  options: CloudQueueOptions = {}
) {
  const controls = await getControlsAdmin(sb, project_id);
  if (controls.kill_switch) return { aborted: true, reason: "kill_switch" };

  const queue = await loadCommandQueue(sb, project_id, options);
  if (!queue.length) return { dispatched: 0, results: [] };

  let dispatched = 0;
  const results: Array<Record<string, any>> = [];

  for (const cmd of queue) {
    if (!isCloudNode(cmd.node_id)) {
      results.push({ id: cmd.id, status: "skipped", reason: "non_cloud_node" });
      continue;
    }

    if (options.nodeId && String(cmd.node_id) !== String(options.nodeId)) {
      results.push({ id: cmd.id, status: "skipped", reason: "node_mismatch" });
      continue;
    }

    const claimed = await claim(sb, project_id, cmd.id);
    if (!claimed) {
      results.push({ id: cmd.id, status: "skipped", reason: "not_queued_anymore" });
      continue;
    }

    const command = String(cmd.command || "").trim().toLowerCase();
    const payload = cmd.payload ?? {};

    if (!controls.allow_write && (WRITE_COMMANDS.has(command) || !READONLY_COMMANDS.has(command))) {
      await fail(sb, project_id, cmd.id, "Operación bloqueada: allow_write apagado.");
      await emit(sb, project_id, "warn", "cloud.exec.blocked", `Bloqueo de escritura: ${command}`, {
        command_id: cmd.id,
      });
      results.push({ id: cmd.id, status: "error", reason: "allow_write_off" });
      continue;
    }

    if (secret) {
      const okSig = verifyCommandSignature(
        secret,
        cmd.signature,
        cmd.id,
        cmd.project_id,
        cmd.node_id,
        cmd.command,
        cmd.payload,
        cmd.created_at
      );

      if (!okSig) {
        await fail(sb, project_id, cmd.id, "Firma digital inválida (Posible manipulación).");
        await emit(sb, project_id, "critical", "cloud.exec.security", `Intento de inyección no firmado para: ${command}`, {
          command_id: cmd.id,
        });
        results.push({ id: cmd.id, status: "error", reason: "invalid_signature" });
        continue;
      }
    }

    try {
      await emit(sb, project_id, "info", "cloud.exec.start", `Iniciando ejecución remota: ${command}`, {
        command_id: cmd.id,
        node: cmd.node_id,
      });

      const out = await executeLocalCloud(command, payload);
      await done(sb, project_id, cmd.id, out);

      await emit(sb, project_id, "info", "cloud.exec.done", `Orden ejecutada con éxito: ${command}`, {
        command_id: cmd.id,
        result: out,
      });
      results.push({ id: cmd.id, status: "done", result: out });
      dispatched++;
    } catch (e: any) {
      const msg = String(e?.message || e || "Error desconocido en motor de nube.");
      await fail(sb, project_id, cmd.id, msg);
      await emit(sb, project_id, "error", "cloud.exec.fail", `Falla de ejecución: ${command}`, {
        command_id: cmd.id,
        error: msg,
      });
      results.push({ id: cmd.id, status: "error", reason: msg });
    }
  }

  return { dispatched, results };
}