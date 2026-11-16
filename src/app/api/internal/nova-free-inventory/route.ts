import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
const PROJECT = "hocker-one";
const Body = z.object({
  contract_version: z.literal(1),
  project_id: z.literal("hocker-one"),
  action: z.literal("process_one_owner_approved_inventory"),
}).strict();

function response(value: Record<string, unknown>, status = 200) {
  return NextResponse.json(value, { status,
    headers: { "Cache-Control": "no-store, max-age=0" } });
}

function authorized(request: Request): boolean {
  const token = String(process.env.NOVA_FREE_INVENTORY_TOKEN ?? "");
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/.exec(header);
  const supplied = match?.[1] ?? "";
  if (token.length < 40 || token.length > 256 || supplied.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
}

/**
 * Scoped Cloudflare Cron action. A valid secret CANNOT create approvals,
 * perform inference, claim arbitrary tasks, enable tool access or choose
 * providers. The service_role-only RPC validates every approval and performs
 * one atomic count-only snapshot, or returns no work.
 */
export async function POST(request: NextRequest) {
  if (process.env.NOVA_FREE_INVENTORY_ENABLED !== "true") {
    return response({ ok: false, code: "FREE_INVENTORY_SERVICE_DISABLED" }, 404);
  }
  if (!authorized(request)) {
    return response({ ok: false, code: "FREE_INVENTORY_SERVICE_UNAUTHORIZED" }, 401);
  }
  if (!Body.safeParse(await request.json().catch(() => null)).success) {
    return response({ ok: false, code: "FREE_INVENTORY_CONTRACT_REJECTED" }, 400);
  }

  const deploymentSha = String(process.env.VERCEL_GIT_COMMIT_SHA ?? "").trim();
  if (!/^[a-f0-9]{40}$/.test(deploymentSha)) {
    return response({ ok: false, code: "FREE_INVENTORY_DEPLOYMENT_SHA_UNAVAILABLE" }, 503);
  }
  const workerId = "hocker-free-inventory:" + randomUUID();
  try {
    const { data, error } = await createAdminSupabase().rpc(
      "run_owner_free_inventory_v1", {
        p_project_id: PROJECT, p_worker_id: workerId,
        p_deployment_sha: deploymentSha,
      },
    );
    if (error || !data || data.ok !== true ||
      typeof data.processed !== "boolean" ||
      data.model_requests !== 0) {
      return response({
        ok: false, code: "FREE_INVENTORY_ATOMIC_EXECUTION_UNVERIFIED",
        no_model: true,
      }, 503);
    }
    if (!data.processed) {
      if (!["NO_OWNER_APPROVED_INVENTORY", "OWNER_APPROVAL_EXPIRED", "OWNER_REVISION_CHANGED_CANCELED"].includes(data.reason)) {
        return response({ ok: false, code: "FREE_INVENTORY_NOOP_CONTRACT_INVALID" }, 503);
      }
      return response({
        ok: true, processed: false, reason: data.reason,
        model_requests: 0, task_claims: 0,
      });
    }
    if (data.status !== "completed" ||
        !/^[0-9a-f-]{36}$/i.test(String(data.task_id ?? "")) ||
        !/^[0-9a-f-]{36}$/i.test(String(data.run_id ?? "")) ||
        !/^[a-f0-9]{64}$/.test(String(data.result_hash ?? "")) ||
        data.tools_executed !== 0 ||
        data.external_writes_executed !== false ||
        data.no_paid_fallback !== true ||
        data.source !== "supabase_live_count_only") {
      return response({ ok: false, code: "FREE_INVENTORY_RESULT_CONTRACT_UNVERIFIED" }, 503);
    }
    return response({
      ok: true, processed: true, status: "completed",
      task_id: data.task_id, run_id: data.run_id, result_hash: data.result_hash,
      source: "supabase_live_count_only",
      model_requests: 0, tools_executed: 0,
      external_writes_executed: false, no_paid_fallback: true,
    });
  } catch {
    return response({ ok: false, code: "FREE_INVENTORY_REQUEST_FAILED" }, 503);
  }
}
