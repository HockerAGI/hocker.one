import { createHash, randomUUID } from "node:crypto";
import { CF_FREE_MODEL } from "@/lib/cloudflare-zero-credit-policy";
import { cloudflareWorkersAiProvider } from "@/lib/agi-model-providers/cloudflare-workers-ai";
import { reserveOneFreeUnifiedHostiaTask } from "@/lib/agi-free-unified-canary";
import { HOCKER_AGI_CANON_VERSION, type HockerAgiCanonRecord } from "@/lib/hocker-agi-canon";
import {
  buildCanonicalProfilePrompt,
  canonicalAgiId,
  isOperationalAgi,
  requireCanonicalAgi,
} from "@/lib/hocker-agi-operational";
import { completeAgi, configuredAgiRoutes } from "@/lib/agi-model-router";
import { buildAgiNativeMcpTools, executeAgiMcpToolCalls, toLegacyAgiMcpToolCalls } from "@/lib/agi-mcp-runtime";
import { extractLearningCandidate } from "@/lib/agi-learning-extractor";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { assertAgiBacklogReviewed, inspectAgiBacklog } from "@/lib/agi-stale-backlog-gate";
import {
  createServerlessAgiTask,
  recoverStaleServerlessAgiTasks,
  getServerlessAgiWorkerStatus,
} from "@/lib/serverless-agi-runtime";

type JsonRecord = Record<string, unknown>;
type RpcError = { message: string };
type RpcResult<T> = { data: T | null; error: RpcError | null };
type RpcClient = { rpc<T>(name: string, args: JsonRecord): PromiseLike<RpcResult<T>> };

type AgiProfile = {
  id: HockerAgiCanonRecord["id"];
  name: string;
  canon: HockerAgiCanonRecord;
};

type AgiTask = {
  id: string;
  project_id: string;
  agi_id: string | null;
  assigned_to?: string | null;
  title: string;
  details: string | null;
  priority: string;
  payload: JsonRecord;
  input: JsonRecord;
  write_policy: string;
  attempt_count: number;
};

function db() {
  return createAdminSupabase();
}

function rpcDb(): RpcClient {
  return createAdminSupabase() as unknown as RpcClient;
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function safeError(error: unknown): string {
  if (!(error instanceof Error)) return "UNIFIED_AGI_RUNTIME_FAILED";
  return error.message.replace(/[\r\n]+/g, " ").trim().slice(0, 1000) || "UNIFIED_AGI_RUNTIME_FAILED";
}

async function loadProfile(rawId: string): Promise<AgiProfile> {
  const agiId = canonicalAgiId(rawId);
  const canon = requireCanonicalAgi(agiId);
  if (canon.id === "shadows" || !isOperationalAgi(canon.id)) {
    throw new Error(`AGI_PROFILE_NOT_OPERATIONAL: ${canon.id}`);
  }

  const { data, error } = await db()
    .from("agis")
    .select("id,name")
    .eq("id", canon.id)
    .maybeSingle<{ id: string; name: string }>();
  if (error) throw new Error(`AGI_PROFILE_LOOKUP_FAILED: ${error.message}`);
  if (!data) throw new Error(`AGI_PROFILE_NOT_FOUND: ${canon.id}`);
  return { id: canon.id, name: canon.name, canon };
}

function taskPrompt(task: AgiTask): string {
  return [
    `Tarea: ${task.title}`,
    task.details ? `Detalles: ${task.details}` : "",
    `Prioridad: ${task.priority}`,
    `Política de escritura: ${task.write_policy}`,
    `Input:\n${JSON.stringify(task.input ?? {}, null, 2)}`,
    `Contexto adicional:\n${JSON.stringify(task.payload ?? {}, null, 2)}`,
    "Entrega estado real, hallazgos verificables, riesgos, datos faltantes y siguientes acciones propuestas. No ejecutes acciones externas.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function startVerifiedRun(args: {
  task: AgiTask;
  profile: AgiProfile;
  worker_id: string;
  provider: string;
  model: string;
  free_only_canary?: boolean;
}): Promise<string> {
  const { data, error } = await rpcDb().rpc<Array<{ run_id: string }>>(
    "start_serverless_agi_execution",
    {
      p_task_id: args.task.id,
      p_project_id: args.task.project_id,
      p_agi_id: args.profile.id,
      p_worker_id: args.worker_id,
      p_provider: args.provider,
      p_model: args.model,
      p_input: {
        title: args.task.title,
        details: args.task.details,
        priority: args.task.priority,
        payload: args.task.payload,
        input: args.task.input,
        canon_version: HOCKER_AGI_CANON_VERSION,
        provider_independent_router: args.free_only_canary !== true,
        free_only_canary: args.free_only_canary === true,
      },
      p_trace_id: randomUUID(),
      p_attempt: Math.max(1, Number(args.task.attempt_count || 1)),
    },
  );

  const runId = String(data?.[0]?.run_id ?? "").trim();
  if (error || !runId) {
    throw new Error(`AGI_RUN_START_FAILED: ${error?.message ?? "run_id_missing"}`);
  }
  return runId;
}

async function markRunFailed(runId: string, errorMessage: string, evidence: JsonRecord[]): Promise<void> {
  const { error } = await db()
    .from("agi_runs")
    .update({
      status: "failed",
      output: { ok: false, verified_execution: false, canon_version: HOCKER_AGI_CANON_VERSION },
      evidence,
      result_hash: null,
      error: errorMessage,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("status", "running");
  if (error) throw new Error(`AGI_RUN_FAILURE_UPDATE_FAILED: ${error.message}`);
}

export { createServerlessAgiTask, recoverStaleServerlessAgiTasks };

export async function getUnifiedAgiWorkerStatus(
  projectId: string,
  oidcToken?: string | null,
): Promise<JsonRecord> {
  const legacy = await getServerlessAgiWorkerStatus(projectId, oidcToken);
  const routes = configuredAgiRoutes(oidcToken);
  const schemaReady = legacy.schema_ready === true;
  const backlog = await inspectAgiBacklog(projectId);
  return {
    ...legacy,
    service: "hocker-one-unified-agi",
    provider: "hocker-model-router",
    provider_configured: routes.length > 0,
    inference_routes: routes,
    ready: schemaReady && routes.length > 0 && !backlog.blocked,
    stale_backlog: backlog,
    execution_blocked: backlog.blocked,
    external_writes: "owner_gate_only",
  };
}

export async function runUnifiedAgiWorkerOnce(params: {
  project_id: string;
  assigned_agi?: string | null;
  requested_by?: string | null;
  oidc_token?: string | null;
  free_only_hostia_canary?: boolean;
}): Promise<JsonRecord> {
  // Count-only guard before ANY claim RPC, including runtime tokens and run-once.
  await assertAgiBacklogReviewed(params.project_id);
  const freeOnlyHostia = params.free_only_hostia_canary === true;
  const workerId = `hocker-one-unified:${process.env.VERCEL_REGION || "unknown"}:${randomUUID()}`;
  const assignedAgi = freeOnlyHostia ? "hostia"
    : params.assigned_agi ? canonicalAgiId(params.assigned_agi) : null;
  let task: AgiTask | undefined;
  if (freeOnlyHostia) {
    // One exact task INSERT with a unique one-time key and worker lock.
    // NEVER claim a pre-existing or unrelated task in this bounded mode.
    task = await reserveOneFreeUnifiedHostiaTask({
      project_id: params.project_id, requested_by: params.requested_by,
      worker_id: workerId,
    }) as AgiTask;
  } else {
    const { data: claimed, error: claimError } = await rpcDb().rpc<AgiTask[]>(
      "claim_next_agi_task",
      {
        p_project_id: params.project_id,
        p_worker_id: workerId,
        p_assigned_agi: assignedAgi,
      },
    );
    if (claimError) throw new Error(`AGI_TASK_CLAIM_FAILED: ${claimError.message}`);
    task = claimed?.[0];
  }
  if (!task) {
    return {
      ok: true,
      processed: false,
      worker_id: workerId,
      project_id: params.project_id,
      assigned_agi: assignedAgi,
      reason: "NO_QUEUED_TASK",
    };
  }

  let runId: string | null = null;
  try {
    const profile = await loadProfile(task.agi_id || task.assigned_to || assignedAgi || "nova");
    const inputHash = sha256({
      task_id: task.id,
      agi_id: profile.id,
      title: task.title,
      details: task.details,
      input: task.input,
      payload: task.payload,
    });

    runId = await startVerifiedRun({
      task,
      profile,
      worker_id: workerId,
      provider: "hocker-model-router",
      model: "auto",
      free_only_canary: freeOnlyHostia,
    });

    const nativeTools = freeOnlyHostia ? [] : await buildAgiNativeMcpTools(task.title);
    const systemPrompt = freeOnlyHostia
      ? [
          buildCanonicalProfilePrompt(profile.canon),
          "Canario de worker unificado: analiza únicamente el snapshot suministrado. " +
          "No uses herramientas, web, credenciales o acciones. No diagnostiques " +
          "nodos, servidores ni autonomía. Máximo 100 palabras. " +
          "Termina exactamente con FIN_CANARIO.",
        ].join("\n")
      : buildCanonicalProfilePrompt(profile.canon);
    const userPrompt = freeOnlyHostia
      ? "Resume hechos, límites y siguiente verificación a partir de: " +
        JSON.stringify(task.input?.snapshot ?? {})
      : taskPrompt(task);
    const completion = freeOnlyHostia
      ? {
          ...(await cloudflareWorkersAiProvider.complete({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            timeout_ms: 20_000, free_only: true, tools: [], web_search: false,
          })),
          attempts: [{ route: "cloudflare-workers-ai" as const, configured: true, ok: true }],
        }
      : await completeAgi({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          timeout_ms: 42_000,
          oidc_token: params.oidc_token,
          tools: nativeTools,
        });
    if (freeOnlyHostia &&
        (completion.route !== "cloudflare-workers-ai" ||
         completion.provider !== "cloudflare-workers-ai" ||
         completion.model !== CF_FREE_MODEL || completion.tool_calls.length > 0 ||
         !completion.text.trimEnd().endsWith("FIN_CANARIO"))) {
      throw new Error("FREE_UNIFIED_INFERENCE_CONTRACT_REJECTED");
    }

    const nativeCalls = completion.tool_calls ?? [];
    const toolResults = nativeCalls.length
      ? await executeAgiMcpToolCalls(toLegacyAgiMcpToolCalls(nativeCalls), {
          project_id: task.project_id,
          allow_actions: false,
          parent_run_id: runId,
          source_agi_id: profile.id,
        })
      : [];
    const nativeToolResults = toolResults.map((item) => ({
      id: item.id,
      name: nativeCalls.find((call) => call.id === item.id)?.name ?? item.name.replace(".", "__"),
      qualified_name: item.name,
      result: item.result,
      ok: item.executed,
    }));
    const finalCompletion = nativeCalls.length
      ? await completeAgi({
          messages: [
            { role: "system", content: buildCanonicalProfilePrompt(profile.canon) },
            { role: "user", content: taskPrompt(task) },
            { role: "assistant", content: completion.text || "Se solicitaron herramientas HOCKER." },
          ],
          timeout_ms: 42_000,
          oidc_token: params.oidc_token,
          tools: nativeTools,
          tool_calls: nativeCalls,
          tool_results: nativeToolResults,
        })
      : completion;

    const completedAt = new Date().toISOString();
    const output: JsonRecord = {
      ok: true,
      verified_execution: true,
      canon_version: HOCKER_AGI_CANON_VERSION,
      agi_id: profile.id,
      agi_name: profile.name,
      agi_level: profile.canon.level,
      agi_domain: profile.canon.domain,
      task_id: task.id,
      summary: finalCompletion.text,
      provider: finalCompletion.provider,
      model: finalCompletion.model,
      route: finalCompletion.route,
      usage: finalCompletion.usage,
      route_attempts: finalCompletion.attempts,
      requested_by: params.requested_by ?? null,
      completed_at: completedAt,
      external_writes_executed: false,
      owner_gate_required_for_actions: true,
      free_only_canary: freeOnlyHostia,
      no_paid_fallback: freeOnlyHostia,
      tools_executed: freeOnlyHostia ? 0 : nativeCalls.length,
    };
    const resultHash = sha256(output);
    const evidence: JsonRecord[] = [
      {
        kind: freeOnlyHostia ? "verified_free_unified_model_completion" : "verified_model_completion",
        canon_version: HOCKER_AGI_CANON_VERSION,
        provider: finalCompletion.provider,
        model: finalCompletion.model,
        route: finalCompletion.route,
        route_attempts: finalCompletion.attempts,
        worker_id: workerId,
        task_id: task.id,
        agi_id: profile.id,
        input_sha256: inputHash,
        output_sha256: resultHash,
        completed_at: completedAt,
        external_writes_executed: false,
        free_only: freeOnlyHostia,
        no_tools: freeOnlyHostia,
      },
    ];

    const { data: completed, error: completeError } = await rpcDb().rpc<
      Array<{ task_id: string; run_id: string; status: string; result_hash: string }>
    >("complete_serverless_agi_execution", {
      p_task_id: task.id,
      p_worker_id: workerId,
      p_run_id: runId,
      p_output: output,
      p_evidence: evidence,
      p_result_hash: resultHash,
    });
    if (completeError || !completed?.length) {
      throw new Error(
        `AGI_ATOMIC_COMPLETE_FAILED: ${completeError?.message ?? "lock_or_run_not_owned"}`,
      );
    }

    const taskContext = task.payload?.context as JsonRecord | undefined;
    const delegatedTargets = Array.isArray(taskContext?.target_agi_ids)
      ? (taskContext.target_agi_ids as unknown[]).filter((id): id is string => typeof id === "string").slice(0, 12)
      : [];
    if (!freeOnlyHostia) {
      try {
        await extractLearningCandidate({
        project_id: task.project_id,
        session_id: task.id,
        agi_id: profile.id,
        user_message: task.details ?? task.title,
        assistant_message: finalCompletion.text,
        trace_id: runId,
        target_agi_ids: delegatedTargets,
      });
      } catch (learningError) {
        evidence.push({ kind: "syntia_learning_proposal_error", message: safeError(learningError) });
      }
    }

    return {
      ok: true,
      processed: true,
      canon_version: HOCKER_AGI_CANON_VERSION,
      worker_id: workerId,
      free_only_canary: freeOnlyHostia,
      task: {
        id: task.id,
        agi_id: profile.id,
        status: "completed",
        result_hash: resultHash,
      },
      run_id: runId,
      provider: finalCompletion.provider,
      model: finalCompletion.model,
      route: finalCompletion.route,
      evidence,
    };
  } catch (error) {
    const message = safeError(error);
    const failureEvidence: JsonRecord[] = [
      {
        kind: "verified_worker_failure",
        canon_version: HOCKER_AGI_CANON_VERSION,
        worker_id: workerId,
        task_id: task.id,
        agi_id: canonicalAgiId(task.agi_id),
        failed_at: new Date().toISOString(),
        error_code: message.split(":")[0],
      },
    ];

    const failed = await rpcDb().rpc<unknown>("fail_agi_task", {
      p_task_id: task.id,
      p_worker_id: workerId,
      p_error: message,
      p_evidence: failureEvidence,
    });
    if (failed.error) {
      failureEvidence.push({ kind: "failure_persistence_error", message: failed.error.message });
    }

    if (runId) {
      try {
        await markRunFailed(runId, message, failureEvidence);
      } catch (persistenceError) {
        failureEvidence.push({
          kind: "run_failure_persistence_error",
          message: safeError(persistenceError),
        });
      }
    }

    return {
      ok: false,
      processed: true,
      canon_version: HOCKER_AGI_CANON_VERSION,
      worker_id: workerId,
      task: { id: task.id, agi_id: canonicalAgiId(task.agi_id) },
      run_id: runId,
      error: message,
      evidence: failureEvidence,
    };
  }
}
