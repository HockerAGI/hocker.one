import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { inspectAgiBacklog } from "@/lib/agi-stale-backlog-gate";
import { cloudflareFreeRouteConfigured } from "@/lib/cloudflare-zero-credit-policy";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const PROJECT_ID = "hocker-one";
const MAX_REQUEST_BYTES = 512;
const noStore = { "Cache-Control": "no-store, max-age=0" };

function reply(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: noStore });
}

function authorized(req: Request): boolean {
  const expected = process.env.NOVA_EVENT_PREFLIGHT_TOKEN || "";
  const received = req.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/)?.[1] || "";
  if (expected.length < 32 || expected.length > 256 || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function readBoundedContract(req: Request): Promise<boolean> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return false;
  const sizeHeader = req.headers.get("content-length");
  if (sizeHeader !== null && (!/^\d+$/.test(sizeHeader) || Number(sizeHeader) > MAX_REQUEST_BYTES)) return false;
  const reader = req.body?.getReader();
  if (!reader) return false;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_REQUEST_BYTES) return false;
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    const record = payload as Record<string, unknown>;
    return Object.keys(record).length === 3 &&
      record.contract_version === 1 &&
      record.project_id === PROJECT_ID &&
      record.mode === "preflight";
  } catch {
    return false;
  }
}

/**
 * Event-driven Cloudflare migration preflight, deliberately READ-ONLY.
 * This is not an execution permit. No task claim, model inference, external
 * action, node heartbeat, new token or paid provider can be invoked here.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (process.env.NOVA_EVENT_PREFLIGHT_ENABLED !== "true") {
    return reply({ ok: false, code: "NOVA_EVENT_PREFLIGHT_DISABLED" }, 404);
  }
  if (!authorized(req)) {
    return reply({ ok: false, code: "NOVA_EVENT_PREFLIGHT_UNAUTHORIZED" }, 401);
  }
  if (!(await readBoundedContract(req))) {
    return reply({ ok: false, code: "NOVA_EVENT_PREFLIGHT_CONTRACT_INVALID" }, 400);
  }
  try {
    const sb = createAdminSupabase();
    const [backlog, tasks, actions] = await Promise.all([
      inspectAgiBacklog(PROJECT_ID),
      sb.from("agi_tasks").select("id", { count: "exact", head: true })
        .eq("project_id", PROJECT_ID).in("status", ["queued", "pending"]),
      sb.from("agi_action_queue").select("id", { count: "exact", head: true })
        .eq("project_id", PROJECT_ID)
        .in("status", ["needs_approval", "approved", "queued", "running", "executing"]),
    ]);
    if (!backlog.checked || tasks.error || actions.error ||
      typeof tasks.count !== "number" || typeof actions.count !== "number") {
      return reply({ ok: false, code: "NOVA_EVENT_PREFLIGHT_EVIDENCE_UNAVAILABLE" }, 503);
    }
    return reply({
      ok: true,
      service: "hocker-one",
      project_id: PROJECT_ID,
      mode: "event_preflight_only",
      contract_version: 1,
      observed_at: new Date().toISOString(),
      metrics: {
        queued_agi_tasks: tasks.count,
        stale_agi_tasks: backlog.stale_count,
        pending_material_actions: actions.count,
        free_only_route_configured: cloudflareFreeRouteConfigured(),
      },
      ready_for_dispatch: false,
      task_executor: false,
      dedicated_runtime: false,
      tasks_claimed: 0,
      model_requests: 0,
      material_actions_executed: 0,
      owner_gate_bypassed: false,
    }, 200);
  } catch {
    return reply({ ok: false, code: "NOVA_EVENT_PREFLIGHT_FAILED" }, 503);
  }
}
