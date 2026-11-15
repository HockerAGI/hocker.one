/**
 * Inert-by-default Cloudflare event preflight.
 * Never issues task claims, model calls, database mutations or fake heartbeats.
 * This is isolated from the working hocker-nova-coordinator observer.
 */
const TARGET = "https://hockerone.vercel.app/api/internal/nova-event-preflight";
const TARGET_PATH = "/api/internal/nova-event-preflight";
const PREVIEW_HOST = /^hocker-[a-z0-9-]+-hockeragi\.vercel\.app$/;

export function resolveTarget(env) {
  if (env.NOVA_EVENT_PREFLIGHT_STAGE === "production") return TARGET;
  if (env.NOVA_EVENT_PREFLIGHT_STAGE !== "preview") {
    throw new Error("NOVA_EVENT_PREFLIGHT_STAGE_INVALID");
  }
  let url;
  try { url = new URL(env.NOVA_EVENT_PREFLIGHT_PREVIEW_URL); }
  catch { throw new Error("NOVA_EVENT_PREFLIGHT_PREVIEW_URL_INVALID"); }
  // Strict account-owned immutable preview host; never allow redirects, URLs
  // with credentials, ports, queries, fragments, or arbitrary hostnames.
  if (url.protocol !== "https:" || !PREVIEW_HOST.test(url.hostname) ||
    url.pathname !== TARGET_PATH || url.username || url.password ||
    url.port || url.search || url.hash) {
    throw new Error("NOVA_EVENT_PREFLIGHT_PREVIEW_URL_INVALID");
  }
  return url.href;
}
const MAX_RESPONSE_BYTES = 3072;
const TIMEOUT_MS = 6000;
const CONTRACT = JSON.stringify({ contract_version: 1, project_id: "hocker-one", mode: "preflight" });

function validConfig(env) {
  if (env.NOVA_EVENT_PREFLIGHT_ENABLED !== "true") return false;
  const token = env.NOVA_EVENT_PREFLIGHT_TOKEN;
  const bypass = env.NOVA_EVENT_VERCEL_BYPASS_TOKEN;
  if (typeof token !== "string" || token.length < 32 || token.length > 256) {
    throw new Error("NOVA_EVENT_PREFLIGHT_TOKEN_MISSING");
  }
  if (typeof bypass !== "string" || !/^[A-Za-z0-9]{32}$/.test(bypass)) {
    throw new Error("NOVA_EVENT_PREFLIGHT_BYPASS_MISSING");
  }
  if (typeof env.NOVA_EVENT_PREFLIGHT_EXPECTED_SHA !== "string" ||
    !/^[a-f0-9]{40}$/.test(env.NOVA_EVENT_PREFLIGHT_EXPECTED_SHA)) {
    throw new Error("NOVA_EVENT_PREFLIGHT_SHA_INVALID");
  }
  resolveTarget(env);
  return true;
}

async function boundedJson(response) {
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_RESPONSE_BYTES)) {
    throw new Error("NOVA_EVENT_PREFLIGHT_RESPONSE_TOO_LARGE");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("NOVA_EVENT_PREFLIGHT_EMPTY_RESPONSE");
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) throw new Error("NOVA_EVENT_PREFLIGHT_RESPONSE_TOO_LARGE");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("NOVA_EVENT_PREFLIGHT_INVALID_JSON");
  }
}

export async function preflight(env, fetcher = fetch) {
  if (!validConfig(env)) return { ok: false, code: "NOVA_EVENT_PREFLIGHT_DISABLED" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetcher(resolveTarget(env), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.NOVA_EVENT_PREFLIGHT_TOKEN,
        "x-vercel-protection-bypass": env.NOVA_EVENT_VERCEL_BYPASS_TOKEN,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: CONTRACT,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status !== 200) {
      throw new Error("NOVA_EVENT_PREFLIGHT_HTTP_" + response.status);
    }
    if (!String(response.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      throw new Error("NOVA_EVENT_PREFLIGHT_RESPONSE_TYPE");
    }
    const data = await boundedJson(response);
    const m = data?.metrics;
    if (data?.deployment_sha !== env.NOVA_EVENT_PREFLIGHT_EXPECTED_SHA) {
      throw new Error("NOVA_EVENT_PREFLIGHT_SHA_MISMATCH");
    }
    if (data?.ok !== true || data?.service !== "hocker-one" ||
      data?.mode !== "event_preflight_only" || data?.project_id !== "hocker-one" ||
      data?.contract_version !== 1 || data?.ready_for_dispatch !== false ||
      data?.task_executor !== false || data?.dedicated_runtime !== false ||
      data?.tasks_claimed !== 0 || data?.model_requests !== 0 ||
      data?.material_actions_executed !== 0 || data?.owner_gate_bypassed !== false ||
      !m || !["queued_agi_tasks", "stale_agi_tasks", "pending_material_actions"]
        .every(key => Number.isSafeInteger(m[key]) && m[key] >= 0) ||
      typeof m.free_only_route_configured !== "boolean") {
      throw new Error("NOVA_EVENT_PREFLIGHT_CONTRACT_INVALID");
    }
    return {
      ok: true, code: "NOVA_EVENT_PREFLIGHT_VERIFIED",
      queued_agi_tasks: m.queued_agi_tasks,
      stale_agi_tasks: m.stale_agi_tasks,
      pending_material_actions: m.pending_material_actions,
      free_only_route_configured: m.free_only_route_configured,
      ready_for_dispatch: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function safeErrorCode(error) {
  if (error instanceof Error && /^NOVA_EVENT_PREFLIGHT_[A-Z0-9_]+$/.test(error.message)) {
    return error.message;
  }
  if (error instanceof Error && error.name === "AbortError") return "NOVA_EVENT_PREFLIGHT_TIMEOUT";
  return "NOVA_EVENT_PREFLIGHT_REQUEST_FAILED";
}

export default {
  async fetch(request) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/health") {
      return new Response("Not found", { status: 404 });
    }
    return Response.json({
      ok: true, service: "hocker-nova-event-preflight",
      mode: "preflight_only", task_executor: false, dedicated_runtime: false,
    }, { headers: { "Cache-Control": "no-store" } });
  },
  async scheduled(_event, env) {
    if (env.NOVA_EVENT_PREFLIGHT_ENABLED !== "true") return;
    try {
      const result = await preflight(env);
      // No inputs, keys, responses, task contents or any PII in logs.
      console.log(JSON.stringify({ event: "nova_event_preflight", ...result }));
    } catch (error) {
      const code = safeErrorCode(error);
      console.error(JSON.stringify({ event: "nova_event_preflight_failed", code }));
      throw new Error(code);
    }
  },
};
