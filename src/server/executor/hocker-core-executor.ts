import { createAdminSupabase } from "@/lib/supabase-admin";
import type { CommandRow, JsonObject } from "@/lib/types";

function isCommandRow(data: unknown): data is CommandRow {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.id === "string" &&
    typeof d.project_id === "string" &&
    typeof d.node_id === "string" &&
    typeof d.command === "string"
  );
}

export async function executeCommand(commandId: string): Promise<void> {
  const sb = createAdminSupabase();

  // 1. Obtener comando
  const { data, error } = await sb
    .from("commands")
    .select("*")
    .eq("id", commandId)
    .single();

  if (error || !isCommandRow(data)) {
    throw new Error("Invalid command");
  }

  const command = data;

  // 2. Marcar RUNNING
  await sb.from("commands").update({
    status: "running",
    started_at: new Date().toISOString(),
  }).eq("id", command.id);

  await logEvent(sb, command, "info", "command.started");

  try {
    // 3. Ejecutar lógica real
    const result = await resolveExecution(command);

    // 4. Guardar resultado
    await sb.from("commands").update({
      status: "done",
      result,
      finished_at: new Date().toISOString(),
    }).eq("id", command.id);

    await logEvent(sb, command, "info", "command.completed", result);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await sb.from("commands").update({
      status: "error",
      error: message,
      finished_at: new Date().toISOString(),
    }).eq("id", command.id);

    await logEvent(sb, command, "error", "command.failed", { message });
  }
}