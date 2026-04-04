import { createAdminSupabase } from "@/lib/supabase-admin";
import type { CommandRow, JsonObject } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

function isCommandRow(data: unknown): data is CommandRow {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;

  const row = data as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.project_id === "string" &&
    typeof row.node_id === "string" &&
    typeof row.command === "string" &&
    typeof row.created_at === "string"
  );
}

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

async function logEvent(
  sb: ReturnType<typeof createAdminSupabase>,
  command: CommandRow,
  level: "info" | "warn" | "error",
  type: string,
  data?: JsonObject,
): Promise<void> {
  await sb.from("events").insert({
    project_id: command.project_id,
    node_id: command.node_id,
    level,
    type,
    message: type,
    data: data ?? {},
  });
}

async function resolveExecution(command: CommandRow): Promise<JsonObject> {
  const payload = asJsonObject(command.payload);

  switch (command.command) {
    case "ping":
      return {
        ok: true,
        ts: new Date().toISOString(),
      };

    case "node.sync":
      return {
        ok: true,
        nodeId: command.node_id,
        synced: true,
        at: new Date().toISOString(),
      };

    case "system.echo":
      return {
        ok: true,
        echo: payload,
      };

    case "supply.create_order":
      return {
        ok: true,
        command: command.command,
        payload,
        handled: true,
      };

    case "node.activate":
      return {
        ok: true,
        command: command.command,
        nodeId: command.node_id,
        active: true,
      };

    case "node.deactivate":
      return {
        ok: true,
        command: command.command,
        nodeId: command.node_id,
        active: false,
      };

    default:
      throw new Error(`Unknown command: ${command.command}`);
  }
}

export async function executeCommand(commandId: string): Promise<void> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("commands")
    .select("*")
    .eq("id", commandId)
    .single();

  if (error || !isCommandRow(data)) {
    throw new Error(`Invalid command: ${error ? getErrorMessage(error) : "unknown shape"}`);
  }

  const command = data;

  await sb
    .from("commands")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", command.id);

  await logEvent(sb, command, "info", "command.started");

  try {
    const result = await resolveExecution(command);

    await sb
      .from("commands")
      .update({
        status: "done",
        result,
        error: null,
        executed_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      .eq("id", command.id);

    await logEvent(sb, command, "info", "command.completed", result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await sb
      .from("commands")
      .update({
        status: "error",
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", command.id);

    await logEvent(sb, command, "error", "command.failed", {
      message,
    });
  }
}