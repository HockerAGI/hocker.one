/**
 * One bounded, observe-only Cloudflare Worker for HOCKER.
 * No Supabase service-role key, LLM key, command execution or AGI tool access.
 * Scheduled execution is inert until both Worker and Hocker One are enabled.
 */
const TARGET = "https://hockerone.vercel.app/api/internal/nova-coordinator";
const MAX_BODY_BYTES = 4096;
const TIMEOUT_MS = 6000;

function assertSafeConfig(env) {
  if (env.NOVA_COORDINATOR_ENABLED !== "true") return false;
  if (typeof env.NOVA_COORDINATOR_READ_TOKEN !== "string" ||
      env.NOVA_COORDINATOR_READ_TOKEN.length < 32) {
    throw new Error("COORDINATOR_SECRET_MISSING");
  }
  // Vercel Authentication is independent of the narrowly scoped observation token.
  // Never disable deployment protection or reuse a material-action credential.
  if (typeof env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN !== "string" ||
      !/^[A-Za-z0-9]{32}$/.test(env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN)) {
    throw new Error("COORDINATOR_VERCEL_BYPASS_MISSING");
  }
  return true;
}

export async function observe(env, fetcher = fetch) {
  if (!assertSafeConfig(env)) return { ok: false, code: "COORDINATOR_DISABLED" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetcher(TARGET, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + env.NOVA_COORDINATOR_READ_TOKEN,
        "x-vercel-protection-bypass": env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN,
        Accept: "application/json",
        "Cache-Control": "no-store",
      },
      // A 3xx is an explicit failure. Never follow or forward credentials.
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok || response.status !== 200) {
      throw new Error("COORDINATOR_UPSTREAM_HTTP_" + response.status);
    }
    if (!(response.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      throw new Error("COORDINATOR_RESPONSE_TYPE_INVALID");
    }
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new Error("COORDINATOR_RESPONSE_TOO_LARGE");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("COORDINATOR_RESPONSE_EMPTY");
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > MAX_BODY_BYTES) throw new Error("COORDINATOR_RESPONSE_TOO_LARGE");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let payload;
    try { payload = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new Error("COORDINATOR_RESPONSE_NOT_JSON"); }
    const m = payload?.metrics;
    const p = payload?.event_preflight;
    const f = payload?.serverless_free_preflight;
    if (payload?.ok !== true || payload?.service !== "hocker-one" ||
        payload?.coordinator_mode !== "observe_only" ||
        payload?.project_id !== "hocker-one" ||
        payload?.owner_gate_bypassed !== false ||
        payload?.material_actions_executed !== 0 ||
        payload?.model_requests !== 0 ||
        payload?.agi_tasks_claimed !== 0 ||
        !m || !["registered_agi_profiles","queued_agi_tasks",
          "blocked_or_pending_material_actions","fresh_dedicated_nodes"]
          .every(k => Number.isSafeInteger(m[k]) && m[k] >= 0) ||
        !p || p.contract_version !== 1 || p.mode !== "event_preflight_only" ||
        p.checked !== true || !Number.isSafeInteger(p.stale_agi_tasks) ||
        p.stale_agi_tasks < 0 || typeof p.blocked !== "boolean" ||
        p.blocked !== (p.stale_agi_tasks > 0) ||
        p.ready_for_dispatch !== false || p.task_executor !== false ||
        p.dedicated_runtime !== false ||
        !f || f.contract_version !== 1 ||
        f.mode !== "read_only_capacity_observation" ||
        f.checked !== true ||
        f.provider !== "cloudflare-workers-ai" ||
        f.fixed_model !== "@cf/zai-org/glm-4.7-flash" ||
        typeof f.provider_configured !== "boolean" ||
        f.cost_attestation !== "operator_flag_not_billing_api" ||
        f.billing_api_verified !== false ||
        !Number.isSafeInteger(f.globally_enabled_material_agents) ||
        f.globally_enabled_material_agents < 0 ||
        f.globally_enabled_material_agents > m.registered_agi_profiles ||
        f.owner_authorization_required !== true ||
        typeof f.candidate_for_owner_review !== "boolean" ||
        f.candidate_for_owner_review !== Boolean(
          f.provider_configured &&
          m.registered_agi_profiles === 16 &&
          f.globally_enabled_material_agents === 0 &&
          m.queued_agi_tasks === 0 &&
          m.blocked_or_pending_material_actions === 0 &&
          p.blocked === false
        ) ||
        f.automatic_dispatch !== false ||
        f.model_requests_per_tick !== 0 ||
        f.task_claims_per_tick !== 0 ||
        f.dedicated_runtime !== false) {
      throw new Error("COORDINATOR_RESPONSE_CONTRACT_INVALID");
    }
    return {
      ok: true,
      code: "COORDINATOR_OBSERVED",
      registered_agi_profiles: m.registered_agi_profiles,
      queued_agi_tasks: m.queued_agi_tasks,
      pending_material_actions: m.blocked_or_pending_material_actions,
      fresh_dedicated_nodes: m.fresh_dedicated_nodes,
      event_preflight_verified: true,
      stale_agi_tasks: p.stale_agi_tasks,
      stale_backlog_blocked: p.blocked,
      ready_for_dispatch: false,
      free_only_configured_for_owner_review: f.provider_configured,
      owner_review_preflight_clear: f.candidate_for_owner_review,
      material_agent_permissions_enabled: f.globally_enabled_material_agents,
      billing_api_verified: false,
      automatic_dispatch: false,
      model_requests_per_tick: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Sanitize all fetch/redirect errors to fixed codes; never log URL/headers/body. */
export function safeCoordinatorErrorCode(error) {
  if (error instanceof Error &&
      /^COORDINATOR_[A-Z0-9_]+$/.test(error.message)) return error.message;
  if (error instanceof Error && error.name === "AbortError") {
    return "COORDINATOR_FETCH_TIMEOUT";
  }
  if (error instanceof Error && error.name === "TypeError") {
    if (/redirect/i.test(error.message)) return "COORDINATOR_FETCH_REDIRECT_ERROR";
    if (/network|fetch failed|dns|connection|socket|tls/i.test(error.message)) {
      return "COORDINATOR_FETCH_NETWORK_ERROR";
    }
    return "COORDINATOR_FETCH_TYPE_ERROR";
  }
  return "COORDINATOR_REQUEST_FAILED";
}


/**
 * Optional execution pathway. Its Bearer token is separate from the existing
 * observation secret. It can only ask Hocker One to complete a single
 * previously Owner AAL2-authorized count-only snapshot, never an LLM request.
 */
export async function processOneApprovedInventory(env, fetcher = fetch) {
  if (env.NOVA_FREE_INVENTORY_ENABLED !== "true") {
    return { ok: true, processed: false, code: "FREE_INVENTORY_DISABLED" };
  }
  if (typeof env.NOVA_FREE_INVENTORY_TOKEN !== "string" ||
      env.NOVA_FREE_INVENTORY_TOKEN.length < 40 ||
      env.NOVA_FREE_INVENTORY_TOKEN.length > 256) {
    throw new Error("COORDINATOR_INVENTORY_TOKEN_INVALID");
  }
  // The Vercel bypass is ONLY a deployment-protection bypass; the distinct
  // inventory Bearer is the narrowly scoped service authorization.
  if (typeof env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN !== "string" ||
      !/^[A-Za-z0-9]{32}$/.test(env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN)) {
    throw new Error("COORDINATOR_INVENTORY_BYPASS_MISSING");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetcher(
      "https://hockerone.vercel.app/api/internal/nova-free-inventory",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.NOVA_FREE_INVENTORY_TOKEN,
          "x-vercel-protection-bypass": env.NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN,
          Accept: "application/json", "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          contract_version: 1, project_id: "hocker-one",
          action: "process_one_owner_approved_inventory",
        }),
        redirect: "manual",
        signal: controller.signal,
      },
    );
    if (response.status !== 200) {
      throw new Error("COORDINATOR_INVENTORY_HTTP_" + response.status);
    }
    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("COORDINATOR_INVENTORY_RESPONSE_TYPE");
    }
    const declared = response.headers.get("content-length");
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 2048)) {
      throw new Error("COORDINATOR_INVENTORY_RESPONSE_TOO_LARGE");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("COORDINATOR_INVENTORY_EMPTY_RESPONSE");
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > 2048) throw new Error("COORDINATOR_INVENTORY_RESPONSE_TOO_LARGE");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    const bytes = new Uint8Array(size);
    let off = 0;
    for (const part of chunks) { bytes.set(part, off); off += part.byteLength; }
    let result;
    try { result = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new Error("COORDINATOR_INVENTORY_RESPONSE_NOT_JSON"); }

    if (result?.ok !== true || typeof result.processed !== "boolean" ||
        result.model_requests !== 0) {
      throw new Error("COORDINATOR_INVENTORY_CONTRACT_INVALID");
    }
    if (result.processed) {
      if (result.status !== "completed" ||
          !/^[a-f0-9-]{36}$/i.test(result.task_id || "") ||
          !/^[a-f0-9-]{36}$/i.test(result.run_id || "") ||
          !/^[a-f0-9]{64}$/.test(result.result_hash || "") ||
          result.source !== "supabase_live_count_only" ||
          result.tools_executed !== 0 ||
          result.external_writes_executed !== false ||
          result.no_paid_fallback !== true) {
        throw new Error("COORDINATOR_INVENTORY_CONTRACT_INVALID");
      }
      return {
        ok: true, code: "FREE_INVENTORY_COMPLETED", processed: true,
        task_id: result.task_id, run_id: result.run_id,
        model_requests: 0, no_paid_fallback: true,
      };
    }
    if (!["NO_OWNER_APPROVED_INVENTORY", "OWNER_APPROVAL_EXPIRED", "OWNER_REVISION_CHANGED_CANCELED"].includes(result.reason) ||
        result.task_claims !== 0) {
      throw new Error("COORDINATOR_INVENTORY_CONTRACT_INVALID");
    }
    return { ok: true, code: result.reason, processed: false, model_requests: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== "/health") {
      return new Response("Not found", { status: 404 });
    }
    return Response.json({
      ok: true,
      service: "hocker-nova-coordinator",
      mode: "observe_only",
      dedicated_runtime: false,
      task_executor: false,
    }, { headers: { "Cache-Control": "no-store" } });
  },
  async scheduled(_event, env) {
    if (env.NOVA_COORDINATOR_ENABLED !== "true") {
      console.log(JSON.stringify({ event: "coordinator_disabled", mode: "observe_only" }));
      return;
    }
    try {
      const status = await observe(env);
      console.log(JSON.stringify({ event: "coordinator_observation", ...status }));
      // The existing read-only observation must pass before a previously
      // authorized inventory can run. No model or arbitrary task routes.
      if (env.NOVA_FREE_INVENTORY_ENABLED === "true") {
        const result = await processOneApprovedInventory(env);
        console.log(JSON.stringify({ event: "owner_approved_free_inventory_tick", ...result }));
      }
    } catch (error) {
      // Never log upstream responses, prompts or authorization headers.
      const code = safeCoordinatorErrorCode(error);
      console.error(JSON.stringify({ event: "coordinator_failed", code }));
      throw new Error(code);
    }
  },
};
