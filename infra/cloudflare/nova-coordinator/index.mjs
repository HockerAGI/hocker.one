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
        Accept: "application/json",
        "Cache-Control": "no-store",
      },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok || response.status !== 200) {
      throw new Error("COORDINATOR_UPSTREAM_HTTP_" + response.status);
    }
    if (!(response.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      throw new Error("COORDINATOR_RESPONSE_TYPE_INVALID");
    }
    const body = await response.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      throw new Error("COORDINATOR_RESPONSE_TOO_LARGE");
    }
    let payload;
    try { payload = JSON.parse(body); } catch { throw new Error("COORDINATOR_RESPONSE_NOT_JSON"); }
    const m = payload?.metrics;
    if (payload?.ok !== true || payload?.service !== "hocker-one" ||
        payload?.coordinator_mode !== "observe_only" ||
        payload?.project_id !== "hocker-one" ||
        payload?.owner_gate_bypassed !== false ||
        payload?.material_actions_executed !== 0 ||
        payload?.model_requests !== 0 ||
        !m || !["registered_agi_profiles","queued_agi_tasks",
          "blocked_or_pending_material_actions","fresh_dedicated_nodes"]
          .every(k => Number.isSafeInteger(m[k]) && m[k] >= 0)) {
      throw new Error("COORDINATOR_RESPONSE_CONTRACT_INVALID");
    }
    return {
      ok: true,
      code: "COORDINATOR_OBSERVED",
      registered_agi_profiles: m.registered_agi_profiles,
      queued_agi_tasks: m.queued_agi_tasks,
      pending_material_actions: m.blocked_or_pending_material_actions,
      fresh_dedicated_nodes: m.fresh_dedicated_nodes,
    };
  } finally {
    clearTimeout(timeout);
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
    } catch (error) {
      // Never log upstream responses, prompts or authorization headers.
      const code = error instanceof Error &&
        /^COORDINATOR_[A-Z0-9_]+$/.test(error.message)
        ? error.message : "COORDINATOR_REQUEST_FAILED";
      console.error(JSON.stringify({ event: "coordinator_failed", code }));
      throw new Error(code);
    }
  },
};
