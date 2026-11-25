import { createHash } from "node:crypto";
import type { AgiActionQueueRow } from "@/lib/agi-action-execution";

const REVIEWABLE = new Set(["github.create_branch", "github.upsert_file", "github.create_pr"]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

export function ownerActionReviewFingerprint(item: AgiActionQueueRow): string {
  return createHash("sha256").update(JSON.stringify(canonical({
    id: item.id, project_id: item.project_id, action_type: item.action_type, tool_key: item.tool_key,
    title: item.title, payload: item.payload, risk_level: item.risk_level, status: item.status,
    dry_run: item.dry_run, requires_approval: item.requires_approval, updated_at: item.updated_at ?? null,
  }))).digest("hex");
}

// Identify the guided family independently of plan validity. Invalid plans
// must fail closed rather than falling back to a legacy approval.
export function requiresOwnerGitHubReview(item: AgiActionQueueRow): boolean {
  return item.tool_key === "github" && REVIEWABLE.has(item.action_type) &&
    item.payload?.materializer_version === "12.7K-2A";
}

export function isOwnerReviewableGitHubAction(item: AgiActionQueueRow): boolean {
  return requiresOwnerGitHubReview(item) && item.requires_approval === true &&
    record(item.payload?.write_plan).valid === true;
}

export function buildOwnerActionReview(item: AgiActionQueueRow) {
  if (!isOwnerReviewableGitHubAction(item)) throw new Error("ACTION_REVIEW_NOT_SUPPORTED");
  const p = item.payload; const plan = record(p.write_plan); const rollback = record(plan.rollback_plan);
  const string = (value: unknown) => typeof value === "string" ? value : "";
  const list = (value: unknown) => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
  return {
    id: item.id, title: item.title, status: item.status, risk: item.risk_level, operation: item.action_type,
    repository: string(plan.repository ?? p.repository), branch: string(plan.target_branch ?? p.target_branch ?? p.branch ?? p.head),
    base: string(p.base ?? p.base_branch ?? "main"), path: string(p.path), base_sha: string(p.expected_base_sha), file_sha: string(p.expected_sha),
    content: item.action_type === "github.upsert_file" && typeof p.content === "string" ? p.content : null,
    pr_title: item.action_type === "github.create_pr" ? string(p.title) : "",
    pr_body: item.action_type === "github.create_pr" ? string(p.body) : "",
    steps: list(plan.steps), rollback: list(rollback.steps),
    fingerprint: ownerActionReviewFingerprint(item),
  };
}
