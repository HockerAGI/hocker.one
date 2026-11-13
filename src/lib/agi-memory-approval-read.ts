import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  isMemoryApprovedForAgi,
  type MirrorPolicyRow,
  type LearningPolicyRow,
} from "@/lib/agi-memory-policy";

/** One bounded approval/provenance query for each authorized memory read. */
export async function resolveApprovedMemoryIds(
  rows: readonly MirrorPolicyRow[],
  projectId: string,
  nowMs = Date.now(),
): Promise<ReadonlySet<string>> {
  if (rows.length > 100) throw new Error("AGI_MEMORY_APPROVAL_BATCH_OVER_LIMIT");
  const ids = Array.from(new Set(rows.map((row) => row.learning_event_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)));
  const learning = new Map<string, LearningPolicyRow>();

  if (ids.length) {
    const { data, error } = await createAdminSupabase()
      .from("agi_learning_events")
      .select("id,project_id,status,source_hash")
      .eq("project_id", projectId)
      .eq("status", "approved")
      .in("id", ids)
      .limit(ids.length);
    if (error || !data) throw new Error("AGI_MEMORY_APPROVAL_PROVENANCE_READ_FAILED");
    for (const row of data) learning.set(row.id, row);
  }

  return new Set(rows.filter((row) => isMemoryApprovedForAgi(
    row, learning, projectId, nowMs,
  )).map((row) => row.id));
}
