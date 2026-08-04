import { createHash, randomUUID } from "node:crypto";
import { HOCKER_AGI_CANON_VERSION, type HockerAgiCanonRecord } from "@/lib/hocker-agi-canon";
import {
  buildCanonicalProfilePrompt,
  canonicalAgiId,
  isOperationalAgi,
  requireCanonicalAgi,
  routeChatProfile,
} from "@/lib/hocker-agi-operational";
import { createAdminSupabase } from "@/lib/supabase-admin";

type JsonRecord = Record<string, unknown>;
type AdminSupabase = ReturnType<typeof createAdminSupabase>;
type RpcError = { message: string };
type RpcResult<T> = { data: T | null; error: RpcError | null };
type NarrowRpcClient = {
  rpc<T>(functionName: string, args: JsonRecord): PromiseLike<RpcResult<T>>;
};

type AgiProfile = {
  id: HockerAgiCanonRecord["id"];
  name: string;
  canon: HockerAgiCanonRecord;
  meta: JsonRecord;
};

type AgiTask = {
  id: string;
  project_id: string;
  agi_id: string | null;
  assigned_to?: string | null;
  title: string;
  details: string | null;
  status: string;
  priority: string;
  payload: JsonRecord;
  input: JsonRecord;
  write_policy: string;
  attempt_count: number;
  max_attempts: number;
};

type GatewayResponse = {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

type ModelCompletion = {
  provider: "vercel-ai-gateway";
  model: string;
  text: string;
  usage: {
    tokens_in: number | null;
    tokens_out: number | null;
    total_tokens: number | null;
  };
};

function db(): AdminSupabase {
  return createAdminSupabase();
}

function rpcDb(): NarrowRpcClient {
  return createAdminSupabase() as unknown as NarrowRpcClient;
}

function env(...names: string[]): string {
  for (const name of names) {
    const value = String(process.env[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function sha256(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(text).digest("hex");
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function safeError(error: unknown): string {
  if (!(error instanceof Error)) return "SERVERLESS_AGI_RUNTIME_FAILED";
  const message = error.message.replace(/[\r\n]+/g, " ").trim();
  return message.slice(0, 1000) || "SERVERLESS_AGI_RUNTIME_FAILED";
}

function gatewayModel(): string {
  return env("AI_GATEWAY_MODEL_AUTO", "AI_GATEWAY_MODEL_FAST") || "google/gemini-2.5-flash";
}

type GatewayCredential = {
  source: "oidc" | "api_key";
  token: string;
};

function gatewayCredentials(): GatewayCredential[] {
  const oidcToken = env("VERCEL_OIDC_TOKEN");
  const apiKey = env("AI_GATEWAY_API_KEY");
  const credentials: GatewayCredential[] = [];

  // Prefer the deployment identity. Fall back to the manually managed
  // AI Gateway key only after a real 401/403 authentication rejection.
  if (oidcToken) credentials.push({ source: "oidc", token: oidcToken });
  if (apiKey && apiKey !== oidcToken) {
    credentials.push({ source: "api_key", token: apiKey });
  }
  return credentials;
}

async function loadProfile(rawId: string): Promise<AgiProfile> {
  const agiId = canonicalAgiId(rawId);
  const canon = requireCanonicalAgi(agiId);
  const status = canon.id === "shadows" ? "planned" : "active";
  if (status === "planned" || !isOperationalAgi(canon.id)) {
    throw new Error(`AGI_PROFILE_NOT_OPERATIONAL: ${canon.id}`);
  }

  const { data, error } = await db()
    .from("agis")
    .select("id,name,meta")
    .eq("id", canon.id)
    .maybeSingle<{ id: string; name: string; meta: JsonRecord }>();

  if (error) throw new Error(`AGI_PROFILE_LOOKUP_FAILED: ${error.message}`);
  if (!data) throw new Error(`AGI_PROFILE_NOT_FOUND: ${canon.id}`);

  return {
    id: canon.id,
    name: canon.name,
    canon,
    meta: asRecord(data.meta),
  };
}

function profilePrompt(profile: AgiProfile): string {
  return buildCanonicalProfilePrompt(profile.canon);
}

export function serverlessGatewayConfigured(): boolean {
  return gatewayCredentials().length > 0;
}

export async function callServerlessAgiModel(args: {
  profile: AgiProfile;
  prompt: string;
  timeout_ms?: number;
}): Promise<ModelCompletion> {
  const credentials = gatewayCredentials();
  if (!credentials.length) throw new Error("AI_GATEWAY_AUTH_NOT_CONFIGURED");

  const model = gatewayModel();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(5_000, Math.min(args.timeout_ms ?? 40_000, 45_000)),
  );
  const requestBody = JSON.stringify({
    model,
    messages: [
      { role: "system", content: profilePrompt(args.profile) },
      { role: "user", content: args.prompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    stream: false,
  });

  try {
    let lastAuthError = "AI_GATEWAY_AUTH_FAILED";

    for (const [index, credential] of credentials.entries()) {
      const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
          "X-Hocker-Canon-Version": HOCKER_AGI_CANON_VERSION,
          "X-Hocker-Credential-Source": credential.source,
        },
        cache: "no-store",
        signal: controller.signal,
        body: requestBody,
      });

      const payload = (await response.json().catch(() => ({}))) as GatewayResponse;
      if (!response.ok) {
        const message = payload.error?.message || `AI_GATEWAY_HTTP_${response.status}`;
        const authenticationRejected = response.status === 401 || response.status === 403;
        const hasFallback = index < credentials.length - 1;
        if (authenticationRejected && hasFallback) {
          lastAuthError = message;
          continue;
        }
        throw new Error(message);
      }

      const text = String(payload.choices?.[0]?.message?.content ?? "").trim();
      if (!text) throw new Error("AI_GATEWAY_EMPTY_RESPONSE");

      return {
        provider: "vercel-ai-gateway",
        model,
        text,
        usage: {
          tokens_in: payload.usage?.prompt_tokens ?? null,
          tokens_out: payload.usage?.completion_tokens ?? null,
          total_tokens: payload.usage?.total_tokens ?? null,
        },
      };
    }

    throw new Error(lastAuthError);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI_GATEWAY_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function taskPrompt(task: AgiTask): string {
  return [
    `Tarea: ${task.title}`,
    task.details ? `Detalles: ${task.details}` : "",
    `Prioridad: ${task.priority}`,
    `Política de escritura: ${task.write_policy}`,
    `Input:\n${JSON.stringify(task.input ?? {}, null, 2)}`,
    `Contexto adicional:\n${JSON.stringify(task.payload ?? {}, null, 2)}`,
    "Entrega: estado real, hallazgos verificables, riesgos, datos faltantes y siguientes acciones propuestas.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function insertRun(args: {
  task: AgiTask;
  profile: AgiProfile;
  worker_id: string;
  provider: string;
  model: string;
}): Promise<string> {
  const input = {
    title: args.task.title,
    details: args.task.details,
    priority: args.task.priority,
    payload: args.task.payload,
    input: args.task.input,
    canon_version: HOCKER_AGI_CANON_VERSION,
    canonical_profile: {
      id: args.profile.id,
      level: args.profile.canon.level,
      domain: args.profile.canon.domain,
    },
  };
  const { data, error } = await rpcDb().rpc<Array<{ run_id: string }>>(
    "start_serverless_agi_execution",
    {
      p_task_id: args.task.id,
      p_project_id: args.task.project_id,
      p_agi_id: args.profile.id,
      p_worker_id: args.worker_id,
      p_provider: args.provider,
      p_model: args.model,
      p_input: input,
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

async function markRunFailed(args: {
  run_id: string;
  output: JsonRecord;
  evidence: JsonRecord[];
  error: string;
}): Promise<void> {
  const { error } = await db()
    .from("agi_runs")
    .update({
      status: "failed",
      output: args.output,
      evidence: args.evidence,
      result_hash: null,
      error: args.error,
      finished_at: new Date().toISOString(),
    })
    .eq("id", args.run_id)
    .eq("status", "running");

  if (error) throw new Error(`AGI_RUN_FAILURE_UPDATE_FAILED: ${error.message}`);
}

export async function runServerlessAgiWorkerOnce(params: {
  project_id: string;
  assigned_agi?: string | null;
  requested_by?: string | null;
}): Promise<JsonRecord> {
  const workerId = `hocker-one-serverless:${process.env.VERCEL_REGION || "unknown"}:${randomUUID()}`;
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
    const model = gatewayModel();
    runId = await insertRun({
      task,
      profile,
      worker_id: workerId,
      provider: "vercel-ai-gateway",
      model,
    });

    const inputHash = sha256({
      task_id: task.id,
      agi_id: profile.id,
      canon_version: HOCKER_AGI_CANON_VERSION,
      title: task.title,
      details: task.details,
      input: task.input,
      payload: task.payload,
    });
    const completion = await callServerlessAgiModel({
      profile,
      prompt: taskPrompt(task),
      timeout_ms: 42_000,
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
      usage: completion.usage,
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

    const failResult = await rpcDb().rpc<unknown>("fail_agi_task", {
      p_task_id: task.id,
      p_worker_id: workerId,
      p_error: message,
      p_evidence: failureEvidence,
    });
    if (failResult.error) {
      failureEvidence.push({
        kind: "failure_persistence_error",
        message: failResult.error.message,
      });
    }

    if (runId) {
      try {
        await markRunFailed({
          run_id: runId,
          output: {
            ok: false,
            verified_execution: false,
            canon_version: HOCKER_AGI_CANON_VERSION,
          },
          evidence: failureEvidence,
          error: message,
        });
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

export async function createServerlessAgiTask(params: {
  project_id: string;
  to_agi: string;
  subject: string;
  body: string;
  intent: string;
  priority: string;
  write_policy: string;
  context: JsonRecord;
  idempotency_key?: string;
  created_by?: string | null;
}): Promise<JsonRecord> {
  const profile = await loadProfile(params.to_agi);
  const client = db();

  if (params.idempotency_key) {
    const { data: existing, error } = await client
      .from("agi_tasks")
      .select("id,project_id,agi_id,title,status,created_at")
      .eq("project_id", params.project_id)
      .eq("idempotency_key", params.idempotency_key)
      .maybeSingle();
    if (error) throw new Error(`AGI_IDEMPOTENCY_LOOKUP_FAILED: ${error.message}`);
    if (existing) return { ok: true, created: false, task_id: existing.id, task: existing };
  }

  const { data, error } = await client
    .from("agi_tasks")
    .insert({
      project_id: params.project_id,
      agi_id: profile.id,
      title: params.subject,
      details: params.body,
      status: "queued",
      priority: params.priority,
      payload: {
        intent: params.intent,
        context: params.context,
        source: "hocker-one-serverless",
        canon_version: HOCKER_AGI_CANON_VERSION,
        verified_worker_required: true,
      },
      created_by: params.created_by ?? null,
      assigned_to: profile.id,
      request_id: randomUUID(),
      task_type: params.intent || "analysis",
      input: {
        subject: params.subject,
        body: params.body,
        context: params.context,
        canon_version: HOCKER_AGI_CANON_VERSION,
      },
      output: {},
      evidence: [],
      requires_approval: params.write_policy === "owner_gate",
      write_policy: params.write_policy,
      attempt_count: 0,
      max_attempts: 3,
      idempotency_key: params.idempotency_key ?? randomUUID(),
    })
    .select("id,project_id,agi_id,title,status,priority,write_policy,idempotency_key,created_at")
    .single();

  if (error || !data) {
    throw new Error(`AGI_TASK_CREATE_FAILED: ${error?.message ?? "unknown"}`);
  }
  return { ok: true, created: true, task_id: data.id, task: data };
}

export async function recoverStaleServerlessAgiTasks(
  projectId: string,
): Promise<JsonRecord> {
  const { data, error } = await rpcDb().rpc<number>("recover_stale_agi_tasks", {
    p_project_id: projectId,
    p_stale_after: "00:10:00",
  });
  if (error) throw new Error(`AGI_STALE_RECOVERY_FAILED: ${error.message}`);
  return { ok: true, project_id: projectId, recovered: Number(data ?? 0) };
}

export async function getServerlessAgiWorkerStatus(
  projectId: string,
): Promise<JsonRecord> {
  const client = db();
  const [queuedResult, workingResult, recentRunsResult, registryResult] =
    await Promise.all([
      client
        .from("agi_tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "queued"),
      client
        .from("agi_tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "working"),
      client
        .from("agi_runs")
        .select(
          "id,agi_id,status,provider,model,worker_id,result_hash,evidence,finished_at,created_at",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30),
      client.from("agis").select("id,meta"),
    ]);

  const recentRuns = (recentRunsResult.data ?? []) as Array<JsonRecord>;
  const lastVerified =
    recentRuns.find(
      (run) =>
        run.status === "completed" &&
        Boolean(run.provider) &&
        Boolean(run.model) &&
        Boolean(run.worker_id) &&
        Boolean(run.result_hash) &&
        Array.isArray(run.evidence) &&
        run.evidence.length > 0,
    ) ?? null;
  const configured = serverlessGatewayConfigured();
  const schemaReady =
    !queuedResult.error &&
    !workingResult.error &&
    !recentRunsResult.error &&
    !registryResult.error;
  const profiles = ((registryResult.data ?? []) as Array<{ id: string; meta: JsonRecord }>).map(
    (profile) => ({
      id: canonicalAgiId(profile.id),
      status:
        canonicalAgiId(profile.id) === "shadows"
          ? "planned"
          : String(asRecord(profile.meta).status ?? "active"),
    }),
  );

  return {
    ok: true,
    service: "hocker-one-serverless-agi",
    mode: "on_demand",
    project_id: projectId,
    canon_version: HOCKER_AGI_CANON_VERSION,
    provider: "vercel-ai-gateway",
    provider_configured: configured,
    schema_ready: schemaReady,
    ready: configured && schemaReady,
    canonical_profiles: profiles.length,
    operational_profiles: profiles.filter((profile) => profile.id !== "shadows").length,
    planned_profiles: profiles.filter((profile) => profile.id === "shadows"),
    queued_tasks: queuedResult.count ?? 0,
    working_tasks: workingResult.count ?? 0,
    last_verified_run: lastVerified,
    checked_at: new Date().toISOString(),
    external_writes: "owner_gate_only",
  };
}

export async function runServerlessNovaChat(params: {
  project_id: string;
  thread_id?: string | null;
  message: string;
  user_id: string;
  user_email?: string | null;
  context_data?: JsonRecord;
}): Promise<JsonRecord> {
  if (!params.user_id) throw new Error("NOVA_CHAT_AUTH_REQUIRED");

  const threadId = params.thread_id || randomUUID();
  const selectedProfile = routeChatProfile(params.message);
  const profile = await loadProfile(selectedProfile);
  const traceId = randomUUID();
  const client = db();

  const { data: existingThread, error: threadLookupError } = await client
    .from("nova_threads")
    .select("thread_id,user_id,project_id")
    .eq("thread_id", threadId)
    .maybeSingle<{
      thread_id: string;
      user_id: string | null;
      project_id: string | null;
    }>();

  if (threadLookupError) {
    throw new Error(`NOVA_THREAD_LOOKUP_FAILED: ${threadLookupError.message}`);
  }
  if (existingThread?.project_id && existingThread.project_id !== params.project_id) {
    throw new Error("NOVA_THREAD_ACCESS_DENIED");
  }
  if (existingThread?.user_id && existingThread.user_id !== params.user_id) {
    throw new Error("NOVA_THREAD_ACCESS_DENIED");
  }

  const { data: historyData, error: historyError } = await client
    .from("nova_messages")
    .select("role,content,created_at")
    .eq("project_id", params.project_id)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (historyError) {
    throw new Error(`NOVA_HISTORY_READ_FAILED: ${historyError.message}`);
  }

  const history = ((historyData ?? []) as Array<{ role: string; content: string }>).reverse();
  const conversation = history
    .map(
      (item) =>
        `${item.role === "assistant" || item.role === "nova" ? "NOVA" : "Usuario"}: ${item.content}`,
    )
    .join("\n\n");

  const completion = await callServerlessAgiModel({
    profile,
    prompt: [
      conversation ? `Historial reciente:\n${conversation}` : "",
      `Solicitud actual:\n${params.message}`,
      params.context_data && Object.keys(params.context_data).length
        ? `Contexto estructurado:\n${JSON.stringify(params.context_data, null, 2)}`
        : "",
      `Perfil especializado seleccionado automáticamente: ${profile.name} (${profile.id}).`,
      "Responde como NOVA. El perfil especializado es apoyo interno y no debe reemplazar la identidad pública de NOVA.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    timeout_ms: 40_000,
  });

  const userMeta: JsonRecord = {
    trace_id: traceId,
    user_email: params.user_email ?? null,
    runtime: "hocker-one-serverless",
    canon_version: HOCKER_AGI_CANON_VERSION,
  };
  const assistantMeta: JsonRecord = {
    trace_id: traceId,
    provider: completion.provider,
    model: completion.model,
    agi_id: profile.id,
    agi_domain: profile.canon.domain,
    runtime: "hocker-one-serverless",
    canon_version: HOCKER_AGI_CANON_VERSION,
    verified_execution: true,
  };
  const usageMeta: JsonRecord = {
    trace_id: traceId,
    agi_id: profile.id,
    runtime: "hocker-one-serverless",
    canon_version: HOCKER_AGI_CANON_VERSION,
    verified_execution: true,
  };

  const { data: persisted, error: persistenceError } = await rpcDb().rpc<
    Array<{
      thread_id: string;
      user_message_id: string;
      assistant_message_id: string;
      usage_id: string;
    }>
  >("persist_serverless_nova_chat", {
    p_thread_id: threadId,
    p_project_id: params.project_id,
    p_user_id: params.user_id,
    p_title: params.message.slice(0, 120),
    p_user_content: params.message,
    p_assistant_content: completion.text,
    p_user_meta: userMeta,
    p_assistant_meta: assistantMeta,
    p_provider: completion.provider,
    p_model: completion.model,
    p_tokens_in: completion.usage.tokens_in,
    p_tokens_out: completion.usage.tokens_out,
    p_usage_meta: usageMeta,
  });

  if (persistenceError || !persisted?.length) {
    throw new Error(
      `NOVA_CHAT_PERSISTENCE_FAILED: ${persistenceError?.message ?? "transaction_empty"}`,
    );
  }

  return {
    ok: true,
    project_id: params.project_id,
    thread_id: threadId,
    reply: completion.text,
    provider: completion.provider,
    model: completion.model,
    intent: "general",
    agi_id: profile.id,
    canon_version: HOCKER_AGI_CANON_VERSION,
    actions: [],
    trace_id: traceId,
    meta: {
      reason:
        "Respuesta real generada por el runtime serverless de Hocker ONE mediante Vercel AI Gateway y el canon de 16 AGIs.",
      runtime: "hocker-one-serverless",
      verified_execution: true,
      provider: completion.provider,
      model: completion.model,
      agi_profile: {
        id: profile.id,
        name: profile.name,
        level: profile.canon.level,
        domain: profile.canon.domain,
      },
      canon_version: HOCKER_AGI_CANON_VERSION,
      usage: completion.usage,
      persistence: persisted[0],
      context_data: params.context_data ?? {},
      controls: {
        allow_write: false,
        requested_actions: false,
        enqueued_actions: [],
        action_policy: "owner_gate_only",
      },
    },
  };
}
