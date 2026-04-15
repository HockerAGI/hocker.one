import { createAdminSupabase } from "@/lib/supabase-admin";
import type { CommandRow, JsonObject } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

function isCommandRow(data: unknown): data is CommandRow {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

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

// Telemetría liberada: El proceso no bloqueará el hilo principal del ejecutor
async function logEvent(
  sb: ReturnType<typeof createAdminSupabase>,
  command: CommandRow,
  level: "info" | "warn" | "error",
  type: string,
  data?: JsonObject,
): Promise<void> {
  try {
    await sb.from("events").insert({
      project_id: command.project_id,
      node_id: command.node_id,
      level,
      type,
      message: type,
      data: data ?? {},
    });
  } catch (error) {
    console.error("[NOVA] Excepción en el registro de telemetría:", error);
  }
}

async function resolveExecution(command: CommandRow): Promise<JsonObject> {
  const payload = asJsonObject(command.payload);
  const timestamp = new Date().toISOString();

  switch (command.command) {
    case "ping":
      return { ok: true, ts: timestamp };

    case "node.sync":
      return {
        ok: true,
        nodeId: command.node_id,
        synced: true,
        at: timestamp,
      };

    case "system.echo":
      return { ok: true, echo: payload };

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

    case "restart_db":
    case "restart_nova":
    case "restart_telemetry":
      return {
        ok: true,
        command: command.command,
        acknowledged: true,
        handled: true,
        note: "Solicitud registrada y procesada para reinicio de sistema.",
        at: timestamp
      };

    default:
      throw new Error(`Comando no reconocido en la matriz operativa: ${command.command}`);
  }
}

export async function executeCommand(
  commandId: string,
  expectedProjectId?: string,
): Promise<void> {
  const sb = createAdminSupabase();
  const now = new Date().toISOString();

  // BLOQUEO ATÓMICO: Capturamos y bloqueamos el comando en una sola operación de red.
  const { data: command, error: lockError } = await sb
    .from("commands")
    .update({
      status: "running",
      started_at: now,
    })
    .eq("id", commandId)
    .eq("status", "queued")
    .select("*")
    .single();

  if (lockError || !command) {
    throw new Error(`Comando inaccesible, en ejecución por otro nodo o inexistente. Detalle: ${lockError ? getErrorMessage(lockError) : "No data"}`);
  }

  if (!isCommandRow(command)) {
    throw new Error("Estructura de comando corrupta detectada.");
  }

  if (expectedProjectId && command.project_id !== expectedProjectId) {
    throw new Error("Violación de seguridad: Discrepancia en la identidad del proyecto.");
  }

  try {
    // Disparamos el evento de inicio de forma asíncrona
    void logEvent(sb, command, "info", "command.started");

    const result = await resolveExecution(command);
    const finishedAt = new Date().toISOString();

    await sb
      .from("commands")
      .update({
        status: "done",
        result,
        error: null,
        executed_at: finishedAt,
        finished_at: finishedAt,
      })
      .eq("id", command.id)
      .eq("project_id", command.project_id);

    void logEvent(sb, command, "info", "command.completed", result);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error operativo desconocido";
    const errorTime = new Date().toISOString();

    await sb
      .from("commands")
      .update({
        status: "error",
        error: message,
        finished_at: errorTime,
      })
      .eq("id", command.id)
      .eq("project_id", command.project_id);

    void logEvent(sb, command, "error", "command.failed", { message });
  }
}