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
  assert.match(route, /NOVA_UPSTREAM_HTTP_/);
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
  assert.doesNotMatch(route, /PREVIEW_NONCE|3933fe5dad93578/);
});

test("serverless inference uses Vercel AI Gateway and never calls Gemini directly", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /https:\/\/ai-gateway\.vercel\.sh\/v1\/chat\/completions/);
  assert.match(runtime, /AI_GATEWAY_API_KEY/);
  assert.match(runtime, /VERCEL_OIDC_TOKEN/);
  assert.match(runtime, /google\/gemini-2\.5-flash/);
  assert.match(runtime, /provider: "vercel-ai-gateway"/);
  assert.doesNotMatch(runtime, /generativelanguage\.googleapis\.com/);
});

test("serverless gateway prefers Vercel OIDC and falls back only on authentication rejection", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  const oidcPosition = runtime.indexOf('const oidcToken = env("VERCEL_OIDC_TOKEN")');
  const apiKeyPosition = runtime.indexOf('const apiKey = env("AI_GATEWAY_API_KEY")');

  assert.ok(oidcPosition >= 0);
  assert.ok(apiKeyPosition > oidcPosition);
  assert.match(runtime, /gatewayCredentials().length > 0/);
  assert.match(runtime, /response.status === 401 || response.status === 403/);
  assert.match(runtime, /authenticationRejected && hasFallback/);
  assert.match(runtime, /continue;/);
});

test("chat fallback authenticates membership and reserves execution budget", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  assert.match(route, /requireProjectRole\(parsed\.data\.project_id, \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(route, /user_id: chatCtx\.user\.id/);
  assert.match(route, /responseJson\.ok !== true/);
  assert.match(route, /controller\.abort\(\), 8_000/);
});

test("chat persistence fails closed through the atomic persistence RPC", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /NOVA_CHAT_AUTH_REQUIRED/);
  assert.match(runtime, /NOVA_THREAD_LOOKUP_FAILED/);
  assert.match(runtime, /NOVA_THREAD_ACCESS_DENIED/);
  assert.match(runtime, /NOVA_HISTORY_READ_FAILED/);
  assert.match(runtime, /persist_serverless_nova_chat/);
  assert.match(runtime, /NOVA_CHAT_PERSISTENCE_FAILED/);
  assert.doesNotMatch(runtime, /NOVA_THREAD_WRITE_FAILED|NOVA_MESSAGE_WRITE_FAILED|NOVA_USAGE_WRITE_FAILED/);
});

test("verified run startup requires a locked task, provider, model and worker", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  const migration = await read("supabase/migrations/20260803004700_start_serverless_agi_execution.sql");

  assert.match(runtime, /start_serverless_agi_execution/);
  assert.doesNotMatch(runtime, /from\("agi_runs"\)\s*\.insert/);
  assert.match(migration, /VERIFIED_WORKER_ID_REQUIRED/);
  assert.match(migration, /VERIFIED_PROVIDER_REQUIRED/);
  assert.match(migration, /VERIFIED_MODEL_REQUIRED/);
  assert.match(migration, /VERIFIED_TASK_NOT_OWNED/);
  assert.match(migration, /task\.status = 'working'/);
  assert.match(migration, /task\.lock_owner = p_worker_id/);
  assert.match(migration, /revoke all on function public\.start_serverless_agi_execution/);
});

test("verified task and run completion is atomic", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  const migration = await read("supabase/migrations/20260803004500_atomic_serverless_agi_completion.sql");

  assert.match(runtime, /complete_serverless_agi_execution/);
  assert.doesNotMatch(runtime, /complete_agi_task/);
  assert.match(migration, /VERIFIED_WORKER_ID_REQUIRED/);
  assert.match(migration, /VERIFIED_RESULT_HASH_REQUIRED/);
  assert.match(migration, /VERIFIED_EVIDENCE_REQUIRED/);
  assert.match(migration, /VERIFIED_RUN_NOT_OWNED_OR_INCOMPLETE/);
  assert.match(migration, /revoke all on function public\.complete_serverless_agi_execution/);
});
