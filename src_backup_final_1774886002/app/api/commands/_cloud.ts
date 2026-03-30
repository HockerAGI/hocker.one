import { getErrorMessage } from "@/lib/errors";
import { promisify } from "node:util";
import { exec as execCb } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { verifyCommandSignature } from "@/lib/security";
import type { SupabaseClient } from "@supabase/supabase-js";

const exec = promisify(execCb);

/* =========================
   COMMAND DEFINITIONS
========================= */

type BaseCommand = {
  id: string;
  node_id: string;
  command: string;
  payload: unknown;
  signature?: string;
  project_id: string;
  created_at: string;
};

type ReadDirPayload = { path?: string };
type ReadFilePayload = { path?: string; limit?: number; lines?: number };
type ShellPayload = {
  commandLine?: string;
  cmd?: string;
  command?: string;
  cwd?: string;
  timeout?: number;
};
type WritePayload = { path?: string; content?: string };

type CloudExecResult = {
  command: string;
  ok: boolean;
  data?: unknown;
  stdout?: string;
  stderr?: string;
  error?: string;
};

/* =========================
   HELPERS
========================= */

function nowIso() {
  return new Date().toISOString();
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return getErrorMessage(e);
  if (isObject(e) && "message" in e) return String(getErrorMessage(e));
  return String(e);
}

function getWorkspaceRoot() {
  return path.resolve(process.env.HOCKER_WORKSPACE_ROOT || process.cwd());
}

function resolveSandboxPath(input: string) {
  const root = getWorkspaceRoot();
  const resolved = path.resolve(root, input);
  if (!resolved.startsWith(root)) {
    throw new Error("Sandbox violation");
  }
  return resolved;
}

/* =========================
   COMMAND EXECUTION
========================= */

async function execReadDir(payload: ReadDirPayload): Promise<CloudExecResult> {
  const target = resolveSandboxPath(payload.path ?? ".");
  const entries = await fs.readdir(target);
  return { command: "read_dir", ok: true, data: entries };
}

async function execReadFile(payload: ReadFilePayload): Promise<CloudExecResult> {
  const target = resolveSandboxPath(payload.path ?? "");
  const content = await fs.readFile(target, "utf8");
  const limit = payload.limit ?? payload.lines ?? 40;

  return {
    command: "read_file_head",
    ok: true,
    data: content.split("\n").slice(0, limit),
  };
}

async function execShell(payload: ShellPayload): Promise<CloudExecResult> {
  if (process.env.ALLOW_CLOUD_SHELL_EXEC !== "1") {
    throw new Error("Shell disabled");
  }

  const cmd = payload.commandLine ?? payload.cmd ?? payload.command;
  if (!cmd) throw new Error("Missing command");

  const { stdout, stderr } = await exec(String(cmd));

  return {
    command: "shell.exec",
    ok: true,
    stdout,
    stderr,
  };
}

async function execWrite(payload: WritePayload): Promise<CloudExecResult> {
  if (process.env.ALLOW_CLOUD_FS_WRITE !== "1") {
    throw new Error("FS write disabled");
  }

  const target = resolveSandboxPath(payload.path ?? "");
  await fs.writeFile(target, String(payload.content ?? ""));

  return {
    command: "fs.write",
    ok: true,
    data: { path: target },
  };
}

/* =========================
   COMMAND ROUTER
========================= */

async function executeCommand(
  command: string,
  payload: unknown
): Promise<CloudExecResult> {
  if (!isObject(payload)) payload = {};

  switch (command) {
    case "read_dir":
      return execReadDir(payload as ReadDirPayload);

    case "read_file_head":
      return execReadFile(payload as ReadFilePayload);

    case "shell.exec":
      return execShell(payload as ShellPayload);

    case "fs.write":
      return execWrite(payload as WritePayload);

    case "ping":
      return { command, ok: true, data: { pong: true } };

    default:
      throw new Error(`Unsupported command: ${command}`);
  }
}

/* =========================
   MAIN ENGINE
========================= */

export async function processCloudQueue(
  sb: SupabaseClient,
  project_id: string,
  secret: string
) {
  const { data } = await sb
    .from("commands")
    .select("*")
    .eq("project_id", project_id)
    .eq("status", "queued")
    .limit(10);

  const queue = (data ?? []) as BaseCommand[];

  let dispatched = 0;
  const results: unknown[] = [];

  for (const cmd of queue) {
    try {
      if (secret && !verifyCommandSignature(
        secret,
        cmd.signature,
        cmd.id,
        cmd.project_id,
        cmd.node_id,
        cmd.command,
        cmd.payload,
        cmd.created_at
      )) {
        throw new Error("Invalid signature");
      }

      const result = await executeCommand(cmd.command, cmd.payload);

      await sb
        .from("commands")
        .update({
          status: "done",
          result,
          finished_at: nowIso(),
        })
        .eq("id", cmd.id);

      results.push(result);
      dispatched++;

    } catch (e: unknown) {
      const msg = getErrorMessage(e);

      await sb
        .from("commands")
        .update({
          status: "error",
          error: msg,
        })
        .eq("id", cmd.id);

      results.push({ error: msg });
    }
  }

  return { dispatched, results };
}
