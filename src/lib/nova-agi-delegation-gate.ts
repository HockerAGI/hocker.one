/**
 * NOVA -> specialist provenance: reuse public.agi_runs, public.agi_tasks,
 * existing Hocker ONE worker, and its real provider/worker evidence.
 * Disabled unless an operator explicitly attests the funded dispatch route.
 * Never synthesize completion, heartbeat, or AGI worker execution.
 */
import { createHash } from "node:crypto";
import { cloudflareZeroCreditMode } from "@/lib/cloudflare-zero-credit-policy";
import { getServerlessAgiWorkerStatus, isVerifiedSpecialistWorkerRun, serverlessGatewayConfigured } from "@/lib/serverless-agi-runtime";
import { configuredAgiRoutes } from "@/lib/agi-model-router";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import type { AgiCompletionResult } from "@/lib/agi-model-providers/types";

type JsonRecord = Record<string, unknown>;

const ROOT_WORKER = "hocker-one-unified-nova-chat";
const MAX_WORKER_AGE_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** No automatic paid-provider activation or undocumented environment fallback. */
export function novaDelegationDispatchConfigured(): boolean {
  return process.env.AGI_DELEGATION_DISPATCH_ENABLED === "true" &&
    !cloudflareZeroCreditMode();
}

export type NovaDelegationReadiness = { ready: boolean; reason: string };

/**
 * A configured gateway is insufficient: the actual specialist worker must
 * have completed a recent provider-backed run with verifiable evidence.
 * A read-only pilot, historical eval, or stale online node does not count.
 */
export async function inspectNovaDelegationReadiness(
  projectId: string,
  oidcToken?: string | null,
): Promise<NovaDelegationReadiness> {
  if (!novaDelegationDispatchConfigured()) {
    return { ready: false, reason: "AGI_DELEGATION_DISPATCH_DISABLED" };
  }
  // Task creation is a material DB action: only this session's verified
  // Owner MFA AAL2 can activate a delegation, never a role-only chat flag.
  const owner = await requireOwnerAal2Api(projectId);
  if (!owner.ok) return { ready: false, reason: "AGI_DELEGATION_OWNER_AAL2_REQUIRED" };
  // The primary on-demand worker uses the unified router; the legacy worker
  // uses Vercel Gateway. Do not require the legacy key for unified routing.
  if (!serverlessGatewayConfigured(oidcToken) && configuredAgiRoutes(oidcToken).length === 0) {
    return { ready: false, reason: "AGI_DELEGATION_PROVIDER_NOT_CONFIGURED" };
  }
  try {
    const status = await getServerlessAgiWorkerStatus(projectId, oidcToken);
    if (status.schema_ready !== true) {
      return { ready: false, reason: "AGI_DELEGATION_WORKER_NOT_READY" };
    }
    const last = status.last_verified_run as JsonRecord | null;
    const timestamp = Date.parse(String(last?.finished_at ?? ""));
    const currentAge = Date.now() - timestamp;
    const verified = Boolean(last && isVerifiedSpecialistWorkerRun(last)) &&
      Number.isFinite(timestamp) && currentAge >= 0 && currentAge <= MAX_WORKER_AGE_MS;
    return verified
      ? { ready: true, reason: "AGI_VERIFIED_WORKER_RECENT" }
      : { ready: false, reason: "AGI_DELEGATION_NO_RECENT_REAL_WORKER_PROOF" };
  } catch {
    return { ready: false, reason: "AGI_DELEGATION_WORKER_READ_FAILED" };
  }
}

/**
 * Only invoked AFTER a genuine first provider completion, and only if a
 * requested delegation has passed the live worker/cost readiness gate.
 * The run is the original NOVA inference, not an invented specialist result.
 * trace_id doubles as deterministic UUID primary key for safe retries.
 */
export async function persistVerifiedNovaDelegationParent(params: {
  project_id: string;
  trace_id: string;
  session_id: string;
  user_message_id: string;
  completion: AgiCompletionResult;
}): Promise<string> {
  if (!novaDelegationDispatchConfigured()) throw new Error("AGI_DELEGATION_DISPATCH_DISABLED");
  if (!UUID_PATTERN.test(params.trace_id)) throw new Error("AGI_DELEGATION_TRACE_UUID_REQUIRED");
  if (!UUID_PATTERN.test(params.session_id) || !UUID_PATTERN.test(params.user_message_id)) {
    throw new Error("AGI_DELEGATION_CANONICAL_MESSAGE_REQUIRED");
  }
  if (!params.completion.provider || !params.completion.model ||
      (!params.completion.text?.trim() && !params.completion.tool_calls?.length)) {
    throw new Error("AGI_DELEGATION_VERIFIED_COMPLETION_REQUIRED");
  }
  const now = new Date().toISOString();
  const completionSha = digest({
    provider: params.completion.provider,
    model: params.completion.model,
    text: params.completion.text,
    tool_calls: params.completion.tool_calls,
  });
  const input: JsonRecord = {
    kind: "nova_chat_original_inference", session_id: params.session_id,
    user_message_id: params.user_message_id, source: "hocker-one-unified",
  };
  const output: JsonRecord = {
    ok: true, verified_execution: true, kind: "nova_chat_first_model_completion",
    provider: params.completion.provider, model: params.completion.model,
    completion_sha256: completionSha,
    external_writes_executed: false,
  };
  const resultHash = digest(output);
  const evidence = [{
    kind: "verified_nova_chat_model_completion",
    provider: params.completion.provider,
    model: params.completion.model,
    trace_id: params.trace_id,
    session_id: params.session_id,
    user_message_id: params.user_message_id,
    output_sha256: completionSha,
    external_writes_executed: false,
    observed_at: now,
  }];
  const client = createAdminSupabase();
  const { data: existing, error: lookupError } = await client
    .from("agi_runs")
    .select("id,status,result_hash,provider,model")
    .eq("id", params.trace_id)
    .eq("project_id", params.project_id)
    .maybeSingle();
  if (lookupError) throw new Error("AGI_DELEGATION_PARENT_LOOKUP_FAILED");
  if (existing) {
    if (existing.status !== "completed" || existing.result_hash !== resultHash ||
        existing.provider !== params.completion.provider || existing.model !== params.completion.model) {
      throw new Error("AGI_DELEGATION_PARENT_TRACE_COLLISION");
    }
    return existing.id;
  }
  const { data, error } = await client.from("agi_runs").insert({
    id: params.trace_id,
    project_id: params.project_id,
    agi_id: "nova",
    status: "completed",
    input, output,
    provider: params.completion.provider, model: params.completion.model,
    worker_id: ROOT_WORKER,
    trace_id: params.trace_id,
    evidence,
    result_hash: resultHash,
    finished_at: now,
  }).select("id").single();
  if (error || !data?.id) {
    // Concurrent trace retries never authorize an unverified parent row.
    const { data: persisted } = await client.from("agi_runs")
      .select("id,status,result_hash,provider,model")
      .eq("id", params.trace_id).eq("project_id", params.project_id).maybeSingle();
    if (persisted?.status === "completed" && persisted.result_hash === resultHash &&
        persisted.provider === params.completion.provider && persisted.model === params.completion.model) {
      return persisted.id;
    }
    throw new Error("AGI_DELEGATION_PARENT_PERSIST_FAILED");
  }
  return data.id;
}
