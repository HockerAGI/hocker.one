import { createHash, randomUUID } from "node:crypto";
import { HOCKER_AGI_CANON_VERSION, type HockerAgiCanonRecord } from "@/lib/hocker-agi-canon";
import {
  buildCanonicalProfilePrompt,
  canonicalAgiId,
  isOperationalAgi,
  requireCanonicalAgi,
} from "@/lib/hocker-agi-operational";
import { completeAgi, configuredAgiRoutes } from "@/lib/agi-model-router";
import { createAdminSupabase } from "@/lib/supabase-admin";
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
        provider_independent_router: true,
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
  return {
    ...legacy,
    service: "hocker-one-unified-agi",
    provider: "hocker-model-router",
    provider_configured: routes.length > 0,
    inference_routes: routes,
    ready: schemaReady && routes.length > 0,
    external_writes: "owner_gate_only",
  };
}

export async function runUnifiedAgiWorkerOnce(params: {
  project_id: string;
  assigned_agi?: string | null;
  requested_by?: string | null;
  oidc_token?: string | null;
}): Promise<JsonRecord> {
  const workerId = `hocker-one-unified:${process.env.VERCEL_REGION || "unknown"}:${randomUUID()}`;
  const assignedAgi = params.assigned_agi ? canonicalAgiId(params.assigned_agi) : null;
  const { data: claimed, error: claimError } = await rpcDb().rpc<AgiTask[]>(
    "claim_next_agi_task",
    {
      p_project_id: params.project_id,
      p_worker_id: workerId,
      p_assigned_agi: assignedAgi,
    },
  );
  if (claimError) throw new Error(`AGI_TASK_CLAIM_FAILED: ${claimError.message}`);

  const task = claimed?.[0];
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

    const completion = await completeAgi({
      messages: [
        { role: "system", content: buildCanonicalProfilePrompt(profile.canon) },
        { role: "user", content: taskPrompt(task) },
      ],
      timeout_ms: 42_000,
      oidc_token: params.oidc_token,
    });

    runId = await startVerifiedRun({
      task,
      profile,
      worker_id: workerId,
      provider: completion.provider,
      model: completion.model,
    });

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
      summary: completion.text,
      provider: completion.provider,
      model: completion.model,
      route: completion.route,
      usage: completion.usage,
      route_attempts: completion.attempts,
      requested_by: params.requested_by ?? null,
      completed_at: completedAt,
      external_writes_executed: false,
      owner_gate_required_for_actions: true,
    };
    const resultHash = sha256(output);
    const evidence: JsonRecord[] = [
      {
        kind: "verified_model_completion",
        canon_version: HOCKER_AGI_CANON_VERSION,
        provider: completion.provider,
        model: completion.model,
        route: completion.route,
        route_attempts: completion.attempts,
        worker_id: workerId,
        task_id: task.id,
        agi_id: profile.id,
        input_sha256: inputHash,
        output_sha256: resultHash,
        completed_at: completedAt,
        external_writes_executed: false,
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

    return {
      ok: true,
      processed: true,
      canon_version: HOCKER_AGI_CANON_VERSION,
      worker_id: workerId,
      task: {
        id: task.id,
        agi_id: profile.id,
        status: "completed",
        result_hash: resultHash,
      },
      run_id: runId,
      provider: completion.provider,
      model: completion.model,
      route: completion.route,
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
