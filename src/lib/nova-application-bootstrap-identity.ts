import { createHash } from "node:crypto";

/**
 * One application repository name can exist only once per organization.
 * Retry a partially completed Owner-Gated GitHub -> Vercel chain using the
 * same key; never derive it from wall-clock time, a model response, or a
 * non-persisted per-request random identifier.
 */
export function stableNovaApplicationBootstrapId(input: {
  project_id: string;
  created_by: string;
  repository_name: string;
}): string {
  const projectId = input.project_id.trim();
  const ownerId = input.created_by.trim();
  const repoName = input.repository_name.trim().toLowerCase();
  if (!projectId || !ownerId || !repoName) {
    throw new Error("NOVA_APP_BOOTSTRAP_IDENTITY_INCOMPLETE");
  }

  const digest = createHash("sha256")
    .update(JSON.stringify(["nova-app-bootstrap-v2", projectId, ownerId, repoName]))
    .digest("hex");
  return "bootstrap_v2_" + digest.slice(0, 24);
}

export function githubBootstrapParentState(input: {
  id?: unknown;
  status?: unknown;
}): { eligible: boolean; id: string | null; status: string } {
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const status = typeof input.status === "string" ? input.status.trim() : "";
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Missing IDs, rejected/cancelled/failed actions and unexpected new states
  // must not create a dependent Vercel project approval.
  const eligible = validId && ["needs_approval", "approved", "executed", "completed"].includes(status);
  return { eligible, id: validId ? id : null, status };
}


type QueueAction = Record<string, unknown>;
type QueueLockEvidence = {
  source?: unknown;
  locked?: unknown;
  blocking_count?: unknown;
  active_actions?: Array<{ id?: unknown; status?: unknown }>;
};

function actionPayload(row: QueueAction): Record<string, unknown> | null {
  return row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload as Record<string, unknown>
    : null;
}

/**
 * Narrow exception to Queue Lock: inspection of an existing bootstrap owned
 * by the current actor. Nothing unrelated may be pending, DB snapshots must
 * agree, and only expected Owner-Gated states can be continued. This does not
 * approve, execute or create any action.
 */
export function canResumeOwnApplicationBootstrap(input: {
  project_id: string;
  created_by: string;
  bootstrap_id: string;
  repository_name: string;
  queue_lock: QueueLockEvidence | null | undefined;
  all_blocking_rows: QueueAction[];
  own_bootstrap_rows: QueueAction[];
}): boolean {
  const lock = input.queue_lock;
  if (!lock || lock.source !== "supabase" || lock.locked !== true ||
      typeof lock.blocking_count !== "number" ||
      !Number.isSafeInteger(lock.blocking_count) ||
      lock.blocking_count < 1 || lock.blocking_count > 8 ||
      !Array.isArray(lock.active_actions) ||
      lock.active_actions.length !== lock.blocking_count ||
      input.all_blocking_rows.length !== lock.blocking_count ||
      input.own_bootstrap_rows.length < 1 || input.own_bootstrap_rows.length > 2) {
    return false;
  }

  const expectedRepo = "HockerAGI/" + input.repository_name;
  const githubRows = input.own_bootstrap_rows.filter((row) =>
    row.action_type === "github.create_repository" && row.tool_key === "github");
  const vercelRows = input.own_bootstrap_rows.filter((row) =>
    row.action_type === "vercel.create_project" && row.tool_key === "vercel");
  if (githubRows.length !== 1 || vercelRows.length > 1 ||
      githubRows.length + vercelRows.length !== input.own_bootstrap_rows.length) {
    return false;
  }

  for (const row of input.own_bootstrap_rows) {
    const payload = actionPayload(row);
    if (!payload || row.project_id !== input.project_id ||
        row.created_by !== input.created_by || row.agi_id !== "hostia" ||
        payload.bootstrap_id !== input.bootstrap_id ||
        !githubBootstrapParentState(row).eligible) return false;
    if (row.action_type === "github.create_repository") {
      if (payload.owner !== "HockerAGI" || payload.name !== input.repository_name) return false;
    } else if (payload.repository !== expectedRepo ||
               payload.project_name !== input.repository_name) {
      return false;
    }
  }

  const parentId = githubBootstrapParentState(githubRows[0]).id;
  if (!parentId) return false;
  if (vercelRows.length === 1 &&
      actionPayload(vercelRows[0])?.depends_on_action_id !== parentId) return false;

  const priorById = new Map(input.own_bootstrap_rows.map((row) => [row.id, row]));
  const currentById = new Map(input.all_blocking_rows.map((row) => [row.id, row]));
  if (currentById.size !== input.all_blocking_rows.length) return false;

  for (const blocked of input.all_blocking_rows) {
    const prior = priorById.get(blocked.id);
    if (!prior || prior.status !== blocked.status ||
        !["needs_approval", "approved"].includes(String(blocked.status))) return false;
  }
  return lock.active_actions.every((item) => {
    const current = currentById.get(item.id);
    return current && current.status === item.status;
  });
}
