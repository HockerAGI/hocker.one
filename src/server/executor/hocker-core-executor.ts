import { createAdminSupabase } from "@/lib/supabase-admin";
import { processCloudQueue } from "@/app/api/commands/_cloud";

function isCloudNode(nodeId: string | null | undefined): boolean {
  return String(nodeId ?? "").startsWith("cloud-");
}

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

  if (!isCloudNode(command.node_id)) {
    return;
  }

  if (command.status !== "queued" && command.status !== "needs_approval") {
    return;
  }

  if (command.needs_approval) {
    return;
  }

  await processCloudQueue(sb, {
    commandId,
    nodeId: command.node_id,
  });
}