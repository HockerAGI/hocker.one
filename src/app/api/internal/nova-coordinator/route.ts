import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { inspectAgiBacklog } from "@/lib/agi-stale-backlog-gate";
import { CF_FREE_MODEL, cloudflareFreePilotConfigured } from "@/lib/cloudflare-zero-credit-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const PROJECT_ID = "hocker-one";
const ACTIVE_ACTION_STATUSES = [
  "needs_approval", "approved", "queued", "dry_run_queued",
  "running", "executing", "execution_failed", "failed", "error", "needs_fix", "review",
] as const;

function authenticated(req: Request): boolean {
  const expected = process.env.NOVA_COORDINATOR_READ_TOKEN || "";
  const incoming = req.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/)?.[1] ?? "";
  if (expected.length < 32 || incoming.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
}

/**
 * This endpoint never claims tasks, executes commands, writes rows,
 * invokes inference, or sets a dedicated runtime heartbeat.
 * It returns counts only; all material work remains behind Owner Gate.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (process.env.NOVA_COORDINATOR_OBSERVE_ENABLED !== "true") {
    return NextResponse.json({ ok: false, code: "COORDINATOR_DISABLED" }, { status: 404 });
  }
  if (!authenticated(req)) {
    return NextResponse.json({ ok: false, code: "COORDINATOR_UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const sb = createAdminSupabase();
    const now = new Date();
    const freshAfter = new Date(now.getTime() - 5 * 60_000).toISOString();
    const [agents, tasks, actions, nodes, actionGrants, preflight] = await Promise.all([
      sb.from("agi_agents").select("agi_id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID),
      sb.from("agi_tasks").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).in("status", ["queued", "pending"]),
      sb.from("agi_action_queue").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).in("status", [...ACTIVE_ACTION_STATUSES]),
      sb.from("nodes").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).gte("last_seen_at", freshAfter),
      sb.from("agi_agents").select("agi_id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).eq("allow_actions", true),
      inspectAgiBacklog(PROJECT_ID),
    ]);
    if (!preflight.checked || [agents, tasks, actions, nodes, actionGrants].some((result) =>
      result.error || typeof result.count !== "number" ||
      !Number.isSafeInteger(result.count) || result.count < 0)) {
      return NextResponse.json({ ok: false, code: "COORDINATOR_EVIDENCE_UNAVAILABLE" },
        { status: 503 });
    }

    // These checks are only eligibility to review a future Owner proposal.
    // The read token and Cron remain incapable of dispatch or model calls.
    const providerConfigured = cloudflareFreePilotConfigured();
    const candidateForOwnerReview = providerConfigured &&
      agents.count === 16 && actionGrants.count === 0 &&
      tasks.count === 0 && actions.count === 0 && preflight.blocked === false;
    return NextResponse.json({
      ok: true,
      service: "hocker-one",
      coordinator_mode: "observe_only",
      project_id: PROJECT_ID,
      checked_at: now.toISOString(),
      metrics: {
        registered_agi_profiles: agents.count,
        queued_agi_tasks: tasks.count,
        blocked_or_pending_material_actions: actions.count,
        fresh_dedicated_nodes: nodes.count,
      },
      event_preflight: {
        contract_version: 1,
        mode: "event_preflight_only",
        checked: true,
        stale_agi_tasks: preflight.stale_count,
        blocked: preflight.blocked,
        ready_for_dispatch: false,
        task_executor: false,
        dedicated_runtime: false,
      },
      serverless_free_preflight: {
        contract_version: 1,
        mode: "read_only_capacity_observation",
        checked: true,
        provider: "cloudflare-workers-ai",
        fixed_model: CF_FREE_MODEL,
        provider_configured: providerConfigured,
        // This operator flag is not an independent billing API attestation.
        cost_attestation: "operator_flag_not_billing_api",
        billing_api_verified: false,
        globally_enabled_material_agents: actionGrants.count,
        owner_authorization_required: true,
        candidate_for_owner_review: candidateForOwnerReview,
        automatic_dispatch: false,
        model_requests_per_tick: 0,
        task_claims_per_tick: 0,
        dedicated_runtime: false,
      },
      agi_tasks_claimed: 0,
      model_requests: 0,
      material_actions_executed: 0,
      owner_gate_bypassed: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, code: "COORDINATOR_OBSERVATION_FAILED" },
      { status: 503 });
  }
}
