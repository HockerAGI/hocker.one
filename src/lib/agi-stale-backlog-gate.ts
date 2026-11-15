import "server-only";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const AGI_STALE_BACKLOG_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const AGI_STALE_BACKLOG_BLOCK_CODE = "AGI_WORKER_STALE_BACKLOG_REQUIRES_REVIEW";
export const AGI_STALE_BACKLOG_READ_ERROR = "AGI_WORKER_BACKLOG_PREFLIGHT_UNAVAILABLE";

export type AgiBacklogPreflight =
  | {
      checked: true;
      blocked: boolean;
      stale_count: number;
      threshold_hours: 24;
      reason: string | null;
    }
  | {
      checked: false;
      blocked: true;
      stale_count: null;
      threshold_hours: 24;
      reason: typeof AGI_STALE_BACKLOG_READ_ERROR;
    };

/**
 * Read-only count-only gate mirrored from the dedicated nova.agi worker.
 * It intentionally checks both queued and pending across the entire project,
 * not just the AGI selected for this tick. Never process orphaned old work.
 */
export async function countUnreviewedAgiTasks(
  projectId: string,
  nowMs = Date.now(),
): Promise<number> {
  if (!projectId.trim() || !Number.isFinite(nowMs)) {
    throw new Error("AGI_WORKER_BACKLOG_PREFLIGHT_INVALID");
  }
  const cutoff = new Date(nowMs - AGI_STALE_BACKLOG_MAX_AGE_MS).toISOString();
  const { count, error } = await createAdminSupabase()
    .from("agi_tasks")
    .select("id", { head: true, count: "exact" })
    .eq("project_id", projectId)
    .in("status", ["queued", "pending"])
    .lt("created_at", cutoff);
  if (error || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
    throw new Error(AGI_STALE_BACKLOG_READ_ERROR);
  }
  return count;
}

export async function inspectAgiBacklog(projectId: string): Promise<AgiBacklogPreflight> {
  try {
    const count = await countUnreviewedAgiTasks(projectId);
    return {
      checked: true,
      blocked: count > 0,
      stale_count: count,
      threshold_hours: 24,
      reason: count > 0 ? AGI_STALE_BACKLOG_BLOCK_CODE : null,
    };
  } catch {
    return {
      checked: false,
      blocked: true,
      stale_count: null,
      threshold_hours: 24,
      reason: AGI_STALE_BACKLOG_READ_ERROR,
    };
  }
}

export async function assertAgiBacklogReviewed(projectId: string): Promise<void> {
  // Unchecked database reads are never treated as an empty task queue.
  const staleCount = await countUnreviewedAgiTasks(projectId);
  if (staleCount > 0) throw new Error(AGI_STALE_BACKLOG_BLOCK_CODE);
}
