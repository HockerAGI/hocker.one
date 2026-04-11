import { exec as execCb } from "node:child_process";
import fs, { type Dirent } from "node:fs/promises";
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
          allowWrites: process.env.ALLOW_LOCAL_COMMANDS === "1",
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
        data: entries.map((entry) => ({
          name: entry.name,
          isFile: entry.isFile(),
          isDirectory: entry.isDirectory(),
          isSymbolicLink: entry.isSymbolicLink(),
        })),
      };
    }

    if (cmd === "read_file_head") {
      const file = resolveSandboxPath(asString(p.path, ""));
      const limit = Math.max(1, Math.min(200, asInt(p.lines, 20)));
      const raw = await fs.readFile(file, "utf8");
      const lines = raw.split(/\r?\n/).slice(0, limit).join("\n");

      return {
        command: cmd,
        ok: true,
        data: {
          path: file,
          lines,
          totalLines: raw.split(/\r?\n/).length,
        },
      };
    }
  }

  if (WRITE_COMMANDS.has(cmd) && process.env.ALLOW_LOCAL_COMMANDS !== "1") {
    throw new Error(`Comando de escritura bloqueado por política: ${cmd}`);
  }

  switch (cmd) {
    case "shell.exec": {
      const shellCommand = asString(p.command || p.cmd || "");
      if (!shellCommand) throw new Error("shell.exec requiere payload.command");

      const result = await exec(shellCommand, {
        cwd: getWorkspaceRoot(),
        shell: "/bin/sh",
      });

      return {
        command: cmd,
        ok: true,
        stdout: result.stdout,
        stderr: result.stderr,
        code: 0,
        data: { cwd: getWorkspaceRoot() },
      };
    }

    case "fs.write": {
      const file = resolveSandboxPath(asString(p.path || p.file || ""));
      const content = asString(p.content || p.text || "");

      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, content, "utf8");

      return {
        command: cmd,
        ok: true,
        data: {
          path: file,
          bytes: Buffer.byteLength(content, "utf8"),
        },
      };
    }

    case "run_sql":
      return {
        command: cmd,
        ok: false,
        note: "run_sql está deshabilitado en este executor local.",
      };

    case "stripe.charge":
    case "meta.send_msg":
      return {
        command: cmd,
        ok: false,
        note: `El comando ${cmd} debe ejecutarse en un conector remoto especializado.`,
        data: p,
      };

    default:
      throw new Error(`Comando no soportado en executor local: ${cmd}`);
  }
}

function normalizeResult(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return { value };
}

export async function processCloudQueue(
  sb: SupabaseClient,
  project_id: string,
  options: CloudQueueOptions = {},
): Promise<{
  dispatched: number;
  results: Array<{ id: string } & CloudExecResult>;
}> {
  const results: Array<{ id: string } & CloudExecResult> = [];
  let dispatched = 0;

  const secret = String(process.env.COMMAND_HMAC_SECRET ?? "").trim();

  let query = sb
    .from("commands")
    .select(
      "id,project_id,node_id,command,payload,signature,status,needs_approval,created_at",
    )
    .eq("project_id", project_id)
    .eq("status", "queued")
    .eq("needs_approval", false)
    .order("created_at", { ascending: true })
    .limit(100);

  if (options.commandId) {
    query = query.eq("id", options.commandId);
  }

  if (options.nodeId) {
    query = query.eq("node_id", options.nodeId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const queue = (data ?? []) as CloudCommandRow[];

  for (const cmd of queue) {
    const payload = asRecord(cmd.payload);

    if (
      !secret ||
      !verifyCommandSignature(
        secret,
        cmd.signature,
        cmd.id,
        cmd.project_id,
        cmd.node_id,
        cmd.command,
        payload,
        cmd.created_at,
      )
    ) {
      await sb
        .from("commands")
        .update({
          status: "error",
          error: "Firma inválida o ausente.",
          finished_at: nowIso(),
        })
        .eq("id", cmd.id)
        .eq("project_id", project_id);

      results.push({
        id: cmd.id,
        command: cmd.command,
        ok: false,
        note: "Firma inválida o ausente.",
      });

      continue;
    }

    await sb
      .from("commands")
      .update({
        status: "running",
        started_at: nowIso(),
      })
      .eq("id", cmd.id)
      .eq("project_id", project_id);

    try {
      const out = await executeLocalCloud(cmd.command, payload);
      const resultData = normalizeResult(out.data);

      await sb
        .from("commands")
        .update({
          status: "done",
          result: resultData,
          error: null,
          executed_at: nowIso(),
          finished_at: nowIso(),
        })
        .eq("id", cmd.id)
        .eq("project_id", project_id);

      results.push({ id: cmd.id, ...out });
      dispatched++;
    } catch (err: unknown) {
      const msg = getErrorMessage(err);

      await sb
        .from("commands")
        .update({
          status: "error",
          error: msg,
          finished_at: nowIso(),
        })
        .eq("id", cmd.id)
        .eq("project_id", project_id);

      results.push({
        id: cmd.id,
        command: cmd.command,
        ok: false,
        note: msg,
      });
    }
  }

  return { dispatched, results };
}