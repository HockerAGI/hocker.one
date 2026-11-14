import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";

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
    const [agents, tasks, actions, nodes] = await Promise.all([
      sb.from("agi_agents").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID),
      sb.from("agi_tasks").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).in("status", ["queued", "pending"]),
      sb.from("agi_action_queue").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).in("status", [...ACTIVE_ACTION_STATUSES]),
      sb.from("nodes").select("id", { head: true, count: "exact" })
        .eq("project_id", PROJECT_ID).gte("last_seen_at", freshAfter),
    ]);
    if ([agents, tasks, actions, nodes].some((result) => result.error || result.count === null)) {
      return NextResponse.json({ ok: false, code: "COORDINATOR_EVIDENCE_UNAVAILABLE" },
        { status: 503 });
    }

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
