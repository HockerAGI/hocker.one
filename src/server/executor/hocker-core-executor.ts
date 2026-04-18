import { createAdminSupabase } from "@/lib/supabase-admin";
import { getErrorMessage } from "@/lib/errors";
import { processCloudQueue } from "@/app/api/commands/_cloud";

export async function executeCommand(commandId: string, expectedProjectId?: string): Promise<void> {
  const sb = createAdminSupabase();

  const { data: command, error } = await sb
    .from("commands")
    .select("*")
    .eq("id", commandId)
    .maybeSingle();

  if (error || !command) return;

  if (expectedProjectId && command.project_id !== expectedProjectId) {
    return;
  }

  if (command.status !== "queued" && command.status !== "needs_approval") {
    return;
  }

  if (command.needs_approval) {
    return;
  }

  await processCloudQueue(sb, { commandId });
}