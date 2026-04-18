import { exec as execCb } from "node:child_process";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/errors";
import { verifyCommandSignature } from "@/lib/security";

const exec = promisify(execCb);

const READONLY_COMMANDS = new Set([
  "ping",
  "status",
  "read_dir",
  "read_file_head",
]);

const WRITE_COMMANDS = new Set([
  "shell.exec",
  "fs.write",
  "run_sql",
  "stripe.charge",
  "meta.send_msg",
]);

export type CloudQueueOptions = {
  commandId?: string;
  nodeId?: string;
};

export type CloudExecResult = {
  command: string;
  ok: boolean;
  note?: string;
  data?: unknown;
  stdout?: string;
  stderr?: string;
  code?: number | null;
};

type JsonRecord = Record<string, unknown>;

type CloudCommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: JsonRecord | null;
  signature: string | null;
  status: string;
  needs_approval: boolean;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function getWorkspaceRoot(): string {
  const configured = String(
    process.env.HOCKER_WORKSPACE_ROOT || process.env.WORKSPACE_ROOT || "",
  ).trim();

  return path.resolve(configured || process.cwd());
}

function resolveSandboxPath(requestedPath: string): string {
  const root = getWorkspaceRoot();
  const safeInput = String(requestedPath ?? "").replace(/^~(?=$|\/|\\)/, root);
  const resolved = path.resolve(root, safeInput);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (!resolved.startsWith(rootWithSep) && resolved !== root) {
    throw new Error("Violación de seguridad: intento de escape del sandbox denegado.");
  }

  return resolved;
}

function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asInt(value: unknown, fallback = 0): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function allowWriteExecution(): boolean {
  return process.env.ALLOW_LOCAL_COMMANDS === "1" || process.env.ALLOW_WRITE_COMMANDS === "1";
}

async function executeLocalCloud(
  command: string,
  payload: JsonRecord,
): Promise<CloudExecResult> {
  const cmd = String(command ?? "").trim();
  const p = asRecord(payload);

  if (!cmd) {
    throw new Error("Orden vacía.");
  }

  if (READONLY_COMMANDS.has(cmd)) {
    if (cmd === "ping") {
      return {
        command: cmd,
        ok: true,
        note: "PONG",
        data: { pong: true, ts: nowIso(), root: getWorkspaceRoot() },
      };
    }

    if (cmd === "status") {
      return {
        command: cmd,
        ok: true,
        data: {
          workspace: getWorkspaceRoot(),
          allowWrites: allowWriteExecution(),
          uptime: process.uptime(),
        },
      };
    }

    if (cmd === "read_dir") {
      const dir = resolveSandboxPath(asString(p.path, "."));
      const entries = await fs.readdir(dir, { withFileTypes: true });

      return {
        command: cmd,
        ok: true,
        data: entries.map((entry: Dirent) => ({
          name: entry.name,
          isFile: entry.isFile(),
          isDirectory: entry.isDirectory(),
          isSymbolicLink: entry.isSymbolicLink(),
        })),
      };
    }

    if (cmd === "read_file_head") {
      const file = resolveSandboxPath(asString(p.path, ""));
      const limit = Math.max(1, Math.min(200, asInt(p.limit, 10)));

      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n").slice(0, limit);

      return {
        command: cmd,
        ok: true,
        data: { lines, totalLines: content.split("\n").length },
      };
    }
  }

  if (!WRITE_COMMANDS.has(cmd)) {
    throw new Error(`Comando no reconocido o no autorizado en entorno Cloud: ${cmd}`);
  }

  if (!allowWriteExecution()) {
    throw new Error(`Ejecución de escritura bloqueada por política para: ${cmd}`);
  }

  if (cmd === "fs.write") {
    const file = resolveSandboxPath(asString(p.path, ""));
    const content = asString(p.content, "");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, "utf-8");

    return {
      command: cmd,
      ok: true,
      data: { written: path.relative(getWorkspaceRoot(), file) },
    };
  }

  if (cmd === "shell.exec") {
    const script = asString(p.script, "").trim();
    if (!script) {
      throw new Error("shell.exec requiere payload.script");
    }

    const cwd = getWorkspaceRoot();
    const timeout = Math.max(1000, Math.min(120000, asInt(p.timeout, 30000)));

    const { stdout, stderr } = await exec(script, {
      cwd,
      shell: "/bin/sh",
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        HOME: cwd,
        TMPDIR: path.join(cwd, ".tmp"),
      },
    });

    return {
      command: cmd,
      ok: true,
      data: { cwd, timeout },
      stdout,
      stderr,
      code: 0,
    };
  }

  return {
    command: cmd,
    ok: false,
    note: `Comando soportado por contrato pero no implementado en Cloud: ${cmd}`,
  };
}

export async function processCloudQueue(
  sb: SupabaseClient,
  options?: CloudQueueOptions,
): Promise<void> {
  let query = sb
    .from("commands")
    .select("*")
    .eq("status", "queued")
    .eq("needs_approval", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (options?.commandId) {
    query = query.eq("id", options.commandId);
  }
  if (options?.nodeId) {
    query = query.eq("node_id", options.nodeId);
  }

  const { data: queue, error: fetchErr } = await query;
  if (fetchErr) throw new Error(fetchErr.message);

  if (!queue || queue.length === 0) {
    return;
  }

  const row = queue[0] as CloudCommandRow;

  const { error: lockErr } = await sb
    .from("commands")
    .update({ status: "running", started_at: nowIso() })
    .eq("id", row.id)
    .eq("status", "queued");

  if (lockErr) return;

  const secret = String(process.env.COMMAND_HMAC_SECRET ?? process.env.HOCKER_COMMAND_HMAC_SECRET ?? "").trim();
  if (secret) {
    const isValid = verifyCommandSignature(
      secret,
      row.signature,
      row.id,
      row.project_id,
      row.node_id,
      row.command,
      row.payload,
      row.created_at,
    );

    if (!isValid) {
      await sb
        .from("commands")
        .update({
          status: "error",
          error: "Firma inválida o expirada en el entorno Cloud.",
          finished_at: nowIso(),
        })
        .eq("id", row.id);
      return;
    }
  }

  let result: CloudExecResult;
  let hasError = false;
  let errorMsg = "";

  try {
    result = await executeLocalCloud(row.command, row.payload ?? {});
  } catch (err: unknown) {
    hasError = true;
    errorMsg = getErrorMessage(err);
    result = { command: row.command, ok: false, note: errorMsg };
  }

  await sb
    .from("commands")
    .update({
      status: hasError ? "error" : "done",
      result: result as unknown as Record<string, unknown>,
      error: hasError ? errorMsg : null,
      finished_at: nowIso(),
    })
    .eq("id", row.id);
}