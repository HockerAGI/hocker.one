import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { assertAgiBacklogReviewed } from "@/lib/agi-stale-backlog-gate";
import { CF_FREE_MODEL, cloudflareFreePilotConfigured } from "@/lib/cloudflare-zero-credit-policy";
import { cloudflareWorkersAiProvider } from "@/lib/agi-model-providers/cloudflare-workers-ai";
import { AgiProviderError } from "@/lib/agi-model-providers/types";
import { HOCKER_AGI_CANON } from "@/lib/hocker-agi-canon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROJECT_ID = "hocker-one";
const PilotRequest = z.object({
  confirm: z.literal(true),
  project_id: z.literal("hocker-one"),
  agent: z.enum(["nova", "hostia"]).default("nova"),
}).strict();

function pilotConfigured(): boolean {
  return cloudflareFreePilotConfigured();
}

function result(payload: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function todayKey(agent: "nova" | "hostia" = "nova"): string {
  const prefix = agent === "hostia" ? "free-specialist-v1:" : "free-pilot-v1:";
  return prefix + new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT_ID);
  if (!owner.ok) return owner.response;
  const [nova, specialist] = await Promise.all([
    createAdminSupabase().from("agi_tasks")
      .select("id,status,created_at,completed_at,result_hash,error,output")
      .eq("project_id", PROJECT_ID)
      .eq("idempotency_key", todayKey("nova"))
      .maybeSingle(),
    createAdminSupabase().from("agi_tasks")
      .select("id,status,created_at,completed_at,result_hash,error,output")
      .eq("project_id", PROJECT_ID)
      .eq("idempotency_key", todayKey("hostia"))
      .maybeSingle(),
  ]);
  const { data } = nova;
  if (nova.error || specialist.error) {
    return result({ ok: false, error: "FREE_PILOT_STATUS_UNAVAILABLE" }, 503);
  }
  return result({
    ok: true, mode: "owner_aal2_free_readonly_canary",
    configured: pilotConfigured(),
    ready_for_single_owner_pilot: pilotConfigured() && !data,
    already_started_today: Boolean(data),
    task: data ?? null,
    specialist_task: specialist.data ?? null,
    specialist_agent: "hostia",
    specialist_ready_for_single_owner_pilot: pilotConfigured() && !specialist.data,
    specialist_already_started_today: Boolean(specialist.data),
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

  const agent = parsed.data.agent;
  const workerId = (agent === "hostia" ? "hocker-free-specialist:" : "hocker-free-pilot:") + randomUUID();
  const { data, error } = await createAdminSupabase().rpc(
    agent === "hostia" ? "start_free_readonly_hostia_pilot_v1" : "start_free_readonly_agi_pilot_v1", {
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
      error: String(error?.message ?? "").includes("ALREADY_RUN_TODAY")
        ? (agent === "hostia" ? "FREE_SPECIALIST_ALREADY_RUN_TODAY" : "FREE_PILOT_ALREADY_RUN_TODAY")
        : (agent === "hostia" ? "FREE_SPECIALIST_ATOMIC_START_BLOCKED" : "FREE_PILOT_ATOMIC_START_BLOCKED"),
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
    const hostia = HOCKER_AGI_CANON.find((profile) => profile.id === "hostia");
    if (agent === "hostia" && !hostia) throw new Error("FREE_SPECIALIST_CANON_NOT_FOUND");
    const specialistInstruction = agent === "hostia"
      ? "Eres HOSTIA, especialista de infraestructura del ecosistema HOCKER. " +
        "Rol canónico: " + String(hostia?.role ?? "") + ". " +
        "Dominio canónico: " + String(hostia?.domain ?? "") + ". " +
        "Este análisis no constituye una inspección de servidores, DNS, nodos ni heartbeats. " +
        "Solo puedes analizar los conteos entregados. No infieras que el runtime está activo " +
        "o inactivo, no recomiendes habilitar allow_actions globalmente. " +
        "No puedes usar herramientas, web, credenciales ni ejecutar cambios. " +
        "Separa evidencia medida, límites y siguiente verificación operativa. Responde en español. "
      : "";
    const completion = await cloudflareWorkersAiProvider.complete({
      messages: [
        { role: "system", content:
          specialistInstruction +
          (agent === "nova" ? "Eres NOVA del ecosistema HOCKER. " : "") +
          "Analiza solo los datos del snapshot proporcionado. " +
          "Separa lo comprobado de lo no verificado. No atribuyas capacidades de ejecución, " +
          "runtime dedicado ni Context Bridge completo por estos conteos. " +
          "No tienes herramientas, navegador ni acceso de escritura. " +
          "Una cola sin tareas pendientes NO demuestra que las AGIs estén apagadas, " +
          "fallando o inoperativas; solo muestra ausencia de tareas en ese instante. " +
          "La política allow_actions=false protege acciones materiales: NO implica " +
          "incapacidad para análisis de solo lectura ni exige habilitarla globalmente. " +
          "Nunca recomiendes cambiar allow_actions a true para reactivar agentes. " +
          "Explica el alcance limitado de este snapshot y separa hechos de inferencias. " +
          "Responde en español." },
        { role: "user", content:
          "Analiza este snapshot real de Supabase como " +
          (agent === "hostia" ? "HOSTIA (infraestructura)" : "NOVA") +
          ", sin inventar datos. Entrega hallazgos, límites y una recomendación de siguiente paso: " +
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
      scope: agent === "hostia" ? "one_free_hostia_specialist_analysis" : "one_readonly_analysis",
      agi_id: agent,
      model: completion.model, provider: completion.provider, route: completion.route,
      summary: completion.text, usage: completion.usage, completed_at: now,
      material_actions_executed: 0, tools_executed: 0, no_paid_fallback: true,
    };
    const hash = fingerprint(output);
    const evidence = [{
      kind: agent === "hostia" ? "verified_free_specialist_model_completion" : "free_model_execution_observed",
      agi_id: agent, worker_id: workerId,
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
      run_id: runId, result_hash: hash, model: completion.model, agi_id: agent,
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
