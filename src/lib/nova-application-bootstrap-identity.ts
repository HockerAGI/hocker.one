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
