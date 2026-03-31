import { promisify } from "node:util";
import { exec as execCb } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { verifyCommandSignature } from "@/lib/security";
import { getErrorMessage } from "@/lib/errors";

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
  data?: unknown; // Eliminado 'any'
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
    throw new Error(`VIOLACIÓN DE PERÍMETRO: Acceso denegado a ${requestedPath}.`);
  }
  return resolved;
}

// ... (Mantenemos executeLocalCloud sin cambios lógicos, solo tipado)

export async function processCloudQueue(sb: any, project_id: string, options: CloudQueueOptions = {}) {
  const results = [];
  let dispatched = 0;

  // ... (Lógica de selección de comandos)

  for (const cmd of []) { // Bucle de procesamiento
    try {
      // Inyectamos telemetría de inicio
      const out = await executeLocalCloud(cmd.command, cmd.payload);
      // Registro en la Matriz
      results.push({ id: cmd.id, status: "done", result: out });
      dispatched++;
    } catch (err: unknown) { // Cambio a unknown
      const msg = getErrorMessage(err);
      results.push({ id: cmd.id, status: "error", reason: msg });
    }
  }

  return { dispatched, results };
}
