import { createAdminSupabase } from "@/lib/supabase-admin";
import type { CommandRow, JsonObject } from "@/lib/types";

export async function executeCommand(commandId: string, expectedProjectId?: string): Promise<void> {
  const sb = createAdminSupabase();
  const now = new Date().toISOString();

  // Bloqueo atómico para evitar duplicidad
  const { data: command, error } = await sb
    .from("commands")
    .update({ status: "running", started_at: now })
    .eq("id", commandId)
    .eq("status", "queued")
    .select("*")
    .single();

  if (error || !command) return;

  try {
    // Lógica de ejecución estratégica aquí
    const result = { ok: true, ts: now };

    await sb.from("commands").update({
      status: "done",
      result,
      finished_at: new Date().toISOString()
    }).eq("id", commandId);

  } catch (err: any) {
    await sb.from("commands").update({
      status: "error",
      error: err.message,
      finished_at: new Date().toISOString()
    }).eq("id", commandId);
  }
}
