import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { assertAgiBacklogReviewed } from "@/lib/agi-stale-backlog-gate";
import { CF_FREE_MODEL, cloudflareFreeRouteConfigured } from "@/lib/cloudflare-zero-credit-policy";
import { cloudflareWorkersAiProvider } from "@/lib/agi-model-providers/cloudflare-workers-ai";
import { AgiProviderError } from "@/lib/agi-model-providers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROJECT_ID = "hocker-one";
const PilotRequest = z.object({
  confirm: z.literal(true),
  project_id: z.literal("hocker-one"),
}).strict();

function pilotConfigured(): boolean {
  return process.env.AGI_FREE_READONLY_PILOT_ENABLED === "true" &&
    cloudflareFreeRouteConfigured();
}

function result(payload: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function todayKey(): string {
  return "free-pilot-v1:" + new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT_ID);
  if (!owner.ok) return owner.response;
  const { data, error } = await createAdminSupabase()
    .from("agi_tasks")
    .select("id,status,created_at,completed_at,result_hash,error")
    .eq("project_id", PROJECT_ID)
    .eq("idempotency_key", todayKey())
    .maybeSingle();
  if (error) return result({ ok: false, error: "FREE_PILOT_STATUS_UNAVAILABLE" }, 503);
  return result({
    ok: true, mode: "owner_aal2_free_readonly_canary",
    configured: pilotConfigured(),
    ready_for_single_owner_pilot: pilotConfigured() && !data,
    already_started_today: Boolean(data),
    task: data ?? null,
    model: CF_FREE_MODEL,
    no_tools: true, no_paid_fallback: true,
    autonomous_dispatch_enabled: false,
  });
}

export async function POST(request: NextRequest) {
  // The Owner's current authenticated MFA session, never a shared internal key,
  // is required before any task creation or model request.
  const owner = await requireOwnerAal2Api(PROJECT_ID);
  if (!owner.ok) return owner.response;
  // Browser Owner session is also bound to this exact origin to reduce CSRF.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host);
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return result({ ok: false, error: "FREE_PILOT_ORIGIN_REJECTED" }, 403);
  }
  const parsed = PilotRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return result({ ok: false, error: "FREE_PILOT_EXPLICIT_CONFIRMATION_REQUIRED" }, 400);
  if (!pilotConfigured()) {
    return result({
      ok: false, executed: false, error: "FREE_PILOT_FREE_ROUTE_NOT_CONFIGURED",
      no_paid_fallback: true,
    }, 409);
  }

  // Never borrow the permissive generic claim_next_agi_task or model router.
  // The versioned RPC atomically creates exactly one scoped NOVA task and run.
  try {
    await assertAgiBacklogReviewed(PROJECT_ID);
  } catch {
    return result({ ok: false, executed: false, error: "FREE_PILOT_BACKLOG_PREFLIGHT_BLOCKED" }, 409);
  }

  const workerId = "hocker-free-pilot:" + randomUUID();
  const { data, error } = await createAdminSupabase().rpc(
    "start_free_readonly_agi_pilot_v1", {
      p_project_id: PROJECT_ID,
      p_owner_id: owner.userId,
      p_worker_id: workerId,
    },
  );
  const claimed = Array.isArray(data) ? data[0] : null;
  if (error || !claimed || typeof claimed.task_id !== "string" ||
    typeof claimed.run_id !== "string") {
    return result({
      ok: false, executed: false,
      error: String(error?.message ?? "").includes("FREE_PILOT_ALREADY_RUN_TODAY")
        ? "FREE_PILOT_ALREADY_RUN_TODAY" : "FREE_PILOT_ATOMIC_START_BLOCKED",
    }, 409);
  }

  const taskId = claimed.task_id as string;
  const runId = claimed.run_id as string;
  const snapshot = claimed.snapshot as Record<string, unknown>;
  const supabase = createAdminSupabase();

  try {
    // One bounded Cloudflare Workers AI request. No tools, web search, alternate
    // route, sensitive data or external mutations. The account's verified Free
    // gate and a distinct operator feature flag must both be true.
    const completion = await cloudflareWorkersAiProvider.complete({
      messages: [
        { role: "system", content:
          "Eres NOVA del ecosistema HOCKER. Analiza solo los datos del snapshot proporcionado. " +
          "Separa lo comprobado de lo no verificado. No atribuyas capacidades de ejecución, " +
          "runtime dedicado ni Context Bridge completo por estos conteos. " +
          "No tienes herramientas, navegador ni acceso de escritura. Responde en español." },
        { role: "user", content:
          "Analiza este snapshot real de Supabase, sin inventar datos. " +
          "Entrega hallazgos, riesgos y una recomendación de siguiente paso: " +
          JSON.stringify(snapshot) },
      ],
      timeout_ms: 20_000,
      free_only: true,
      tools: [],
      web_search: false,
    });
    if (completion.route !== "cloudflare-workers-ai" || completion.model !== CF_FREE_MODEL ||
      completion.tool_calls.length > 0 || !completion.text.trim()) {
      throw new Error("FREE_PILOT_MODEL_CONTRACT_REJECTED");
    }
    const now = new Date().toISOString();
    const output = {
      ok: true, verified_model_execution: true, verified_facts_only: false,
      scope: "one_readonly_analysis",
      model: completion.model, provider: completion.provider, route: completion.route,
      summary: completion.text, usage: completion.usage, completed_at: now,
      material_actions_executed: 0, tools_executed: 0, no_paid_fallback: true,
    };
    const hash = fingerprint(output);
    const evidence = [{
      kind: "free_model_execution_observed",
      provider: completion.provider, model: completion.model,
      task_id: taskId, run_id: runId, input_sha256: fingerprint(snapshot),
      output_sha256: hash, completed_at: now, no_tools: true,
      material_actions_executed: false,
    }];
    const persisted = await supabase.rpc("complete_serverless_agi_execution", {
      p_task_id: taskId, p_worker_id: workerId, p_run_id: runId,
      p_output: output, p_evidence: evidence, p_result_hash: hash,
    });
    if (persisted.error || !Array.isArray(persisted.data) || persisted.data.length !== 1) {
      throw new Error("FREE_PILOT_ATOMIC_COMPLETION_UNAVAILABLE");
    }
    return result({
      ok: true, executed: true, verified_model_execution: true, task_id: taskId,
      run_id: runId, result_hash: hash, model: completion.model,
      provider: completion.provider, summary: completion.text, usage: completion.usage,
      no_paid_fallback: true, material_actions_executed: 0,
    });
  } catch (failure) {
    const code = failure instanceof AgiProviderError
      ? failure.code : "FREE_PILOT_EXECUTION_FAILED";
    // No model retry; failure is durable and cannot be requeued automatically.
    await supabase.rpc("fail_agi_task", {
      p_task_id: taskId, p_worker_id: workerId,
      p_error: code, p_evidence: [{
        kind: "free_pilot_failure", run_id: runId, task_id: taskId,
        error_code: code, occurred_at: new Date().toISOString(),
      }],
    });
    await supabase.from("agi_runs").update({
      status: "failed", error: code, finished_at: new Date().toISOString(),
    }).eq("id", runId).eq("status", "running").eq("worker_id", workerId);
    return result({
      ok: false, executed: false, task_id: taskId, run_id: runId,
      error: code, no_paid_fallback: true, material_actions_executed: 0,
    }, 502);
  }
}
