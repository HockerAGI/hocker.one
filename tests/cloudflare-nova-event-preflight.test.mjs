import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker, { preflight, safeErrorCode } from "../infra/cloudflare/nova-event-preflight/index.mjs";

const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");
const token = "t".repeat(40);
const bypass = "b".repeat(32);
const env = {
  NOVA_EVENT_PREFLIGHT_ENABLED: "true",
  NOVA_EVENT_PREFLIGHT_TOKEN: token,
  NOVA_EVENT_VERCEL_BYPASS_TOKEN: bypass,
};
const valid = {
  ok: true, service: "hocker-one", project_id: "hocker-one",
  contract_version: 1, mode: "event_preflight_only",
  ready_for_dispatch: false, task_executor: false, dedicated_runtime: false,
  tasks_claimed: 0, model_requests: 0, material_actions_executed: 0,
  owner_gate_bypassed: false,
  metrics: {
    queued_agi_tasks: 0, stale_agi_tasks: 0,
    pending_material_actions: 0, free_only_route_configured: false,
  },
};
const json = (data = valid) => new Response(JSON.stringify(data), {
  status: 200, headers: { "content-type": "application/json" },
});

test("event preflight stays disabled and cannot execute on an empty configuration", async () => {
  let calls = 0;
  assert.deepEqual(await preflight({}, () => { calls++; }), {
    ok: false, code: "NOVA_EVENT_PREFLIGHT_DISABLED",
  });
  await worker.scheduled({ cron: "* * * * *" }, {});
  assert.equal(calls, 0);
  const health = await worker.fetch(new Request("https://example.test/health"));
  assert.deepEqual(await health.json(), {
    ok: true, service: "hocker-nova-event-preflight",
    mode: "preflight_only", task_executor: false, dedicated_runtime: false,
  });
  assert.equal((await worker.fetch(new Request("https://example.test/execute"))).status, 404);
});

test("one bounded authenticated preflight cannot claim a task or call inference", async () => {
  let calls = 0;
  const result = await preflight(env, async (url, init) => {
    calls++;
    assert.equal(url, "https://hockerone.vercel.app/api/internal/nova-event-preflight");
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "manual");
    assert.equal(init.headers.Authorization, "Bearer " + token);
    assert.equal(init.headers["x-vercel-protection-bypass"], bypass);
    assert.deepEqual(JSON.parse(init.body), {
      contract_version: 1, project_id: "hocker-one", mode: "preflight",
    });
    return json();
  });
  assert.equal(calls, 1);
  assert.equal(result.ok, true);
  assert.equal(result.queued_agi_tasks, 0);
  assert.equal(result.ready_for_dispatch, false);
  assert.equal(JSON.stringify(result).includes(token), false);
  assert.equal(JSON.stringify(result).includes(bypass), false);
});

test("invalid credentials, redirects, oversize payload and unsafe responses fail closed", async () => {
  await assert.rejects(preflight({ NOVA_EVENT_PREFLIGHT_ENABLED: "true" }, () => json()),
    /NOVA_EVENT_PREFLIGHT_TOKEN_MISSING/);
  await assert.rejects(preflight({ ...env, NOVA_EVENT_VERCEL_BYPASS_TOKEN: "bad" }, () => json()),
    /NOVA_EVENT_PREFLIGHT_BYPASS_MISSING/);
  const redirect = new Response(null, { status: 302, headers: { Location: "https://bad.example" } });
  await assert.rejects(preflight(env, async (_url, init) => {
    assert.equal(init.redirect, "manual");
    return redirect;
  }), /NOVA_EVENT_PREFLIGHT_HTTP_302/);
  await assert.rejects(preflight(env, async () => json({ ...valid, tasks_claimed: 1 })),
    /NOVA_EVENT_PREFLIGHT_CONTRACT_INVALID/);
  await assert.rejects(preflight(env, async () => json({ ...valid, model_requests: 1 })),
    /NOVA_EVENT_PREFLIGHT_CONTRACT_INVALID/);
  await assert.rejects(preflight(env, async () => json({ ...valid, ready_for_dispatch: true })),
    /NOVA_EVENT_PREFLIGHT_CONTRACT_INVALID/);
  await assert.rejects(preflight(env, async () => new Response("x".repeat(4000), {
    headers: { "content-type": "application/json" },
  })), /NOVA_EVENT_PREFLIGHT_RESPONSE_TOO_LARGE/);
  assert.equal(safeErrorCode(new TypeError("private " + token)), "NOVA_EVENT_PREFLIGHT_REQUEST_FAILED");
});

test("Hocker endpoint enforces independent token and stays strictly read-only", async () => {
  const route = await read("src/app/api/internal/nova-event-preflight/route.ts");
  const config = await read("infra/cloudflare/nova-event-preflight/wrangler.toml");
  const existing = await read("infra/cloudflare/nova-coordinator/index.mjs");
  assert.match(route, /NOVA_EVENT_PREFLIGHT_ENABLED !== "true"/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /readBoundedContract/);
  assert.match(route, /record.mode === "preflight"/);
  assert.match(route, /inspectAgiBacklog\(PROJECT_ID\)/);
  assert.match(route, /free_only_route_configured: cloudflareFreeRouteConfigured\(\)/);
  assert.match(route, /ready_for_dispatch: false/);
  assert.match(route, /owner_gate_bypassed: false/);
  assert.doesNotMatch(route, /\.rpc\(|\.insert\(|\.update\(|\.upsert\(|\.delete\(|claim_next_agi_task|runUnifiedAgiWorkerOnce|completeAgi\(/);
  assert.match(config, /NOVA_EVENT_PREFLIGHT_ENABLED = "false"/);
  assert.doesNotMatch(config, /^crons\s*=/m);
  assert.match(existing, /coordinator_mode !== "observe_only"|mode: "observe_only"/);
  assert.doesNotMatch(config, /SUPABASE_SERVICE_ROLE_KEY|AGI_WORKER_TOKEN/);
});
