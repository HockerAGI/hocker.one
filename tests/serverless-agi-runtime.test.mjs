import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("worker console uses Hocker ONE serverless execution instead of Railway", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");
  assert.match(route, /runServerlessAgiWorkerOnce/);
  assert.match(route, /createServerlessAgiTask/);
  assert.match(route, /recoverStaleServerlessAgiTasks/);
  assert.doesNotMatch(route, /NOVA_WORKERS_NOT_CONFIGURED|novaRequest\(/);
});

test("NOVA chat falls back to real serverless inference", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  assert.match(route, /runServerlessNovaChat/);
  assert.match(route, /NOVA_UPSTREAM_NOT_CONFIGURED/);
  assert.match(route, /NOVA_UPSTREAM_TIMEOUT/);
  assert.doesNotMatch(route, /NOVA no está configurada en el entorno de producción/);
});

test("verified worker evidence requires provider, model, worker and hashes", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /kind: "verified_model_completion"/);
  assert.match(runtime, /provider: completion\.provider/);
  assert.match(runtime, /model: completion\.model/);
  assert.match(runtime, /worker_id: workerId/);
  assert.match(runtime, /input_sha256: inputHash/);
  assert.match(runtime, /output_sha256: resultHash/);
  assert.match(runtime, /external_writes_executed: false/);
});

test("planned profiles remain fail-closed", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /AGI_PROFILE_NOT_OPERATIONAL/);
  assert.match(runtime, /status === "planned"/);
});

test("public worker trigger stores only hashes and consumes query credentials once", async () => {
  const route = await read("src/app/api/agi/serverless-worker-trigger/route.ts");
  const migration = await read("supabase/migrations/20260803003000_serverless_agi_runtime_tokens.sql");

  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /x-hocker-worker-token/);
  assert.match(route, /supplied\.source === "query" && !data\.one_time/);
  assert.match(route, /eq\("active", true\)/);
  assert.match(route, /is\("used_at", null\)/);
  assert.match(route, /active: false, used_at: now/);
  assert.match(migration, /token_hash text not null unique/);
  assert.match(migration, /revoke all on table public\.agi_runtime_tokens from public, anon, authenticated/);
  assert.doesNotMatch(route, /3933fe5dad93578|PREVIEW_NONCE/);
});
