import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("worker console routes through the unified Hocker runtime", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");
  assert.match(route, /runUnifiedAgiWorkerOnce/);
  assert.match(route, /getUnifiedAgiWorkerStatus/);
  assert.match(route, /createServerlessAgiTask/);
  assert.match(route, /recoverStaleServerlessAgiTasks/);
  assert.doesNotMatch(route, /NOVA_WORKERS_NOT_CONFIGURED|novaRequest\(/);
});

test("NOVA ordinary chat uses the unified runtime before the dedicated compatibility fallback", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  const localPosition = route.indexOf("runToolEnabledUnifiedNovaChat");
  const dedicatedPosition = route.indexOf('fetch(`${baseUrl}/api/v1/chat`');
  assert.ok(localPosition >= 0);
  assert.ok(dedicatedPosition > localPosition);
  assert.match(route, /persistDedicatedNovaFallbackTurn/);
  assert.match(route, /requestTraceId/);
  assert.match(route, /requestThreadId/);
  assert.match(route, /fallback_memory_imported: true/);
});

test("unified worker evidence records the provider and route that actually answered", async () => {
  const runtime = await read("src/lib/unified-agi-runtime.ts");
  assert.match(runtime, /kind: "verified_model_completion"/);
  assert.match(runtime, /provider: completion\.provider/);
  assert.match(runtime, /model: completion\.model/);
  assert.match(runtime, /route: completion\.route/);
  assert.match(runtime, /route_attempts: completion\.attempts/);
  assert.match(runtime, /worker_id: workerId/);
  assert.match(runtime, /input_sha256: inputHash/);
  assert.match(runtime, /output_sha256: resultHash/);
  assert.match(runtime, /external_writes_executed: false/);
});

test("planned profiles remain fail-closed in the unified worker", async () => {
  const runtime = await read("src/lib/unified-agi-runtime.ts");
  assert.match(runtime, /AGI_PROFILE_NOT_OPERATIONAL/);
  assert.match(runtime, /canon\.id === "shadows"/);
  assert.match(runtime, /!isOperationalAgi/);
});

test("public worker trigger stores only hashes and consumes query credentials once", async () => {
  const route = await read("src/app/api/agi/serverless-worker-trigger/route.ts");
  const migration = await read("supabase/migrations/20260803003021_serverless_agi_runtime_tokens.sql");

  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /x-hocker-worker-token/);
  assert.match(route, /supplied\.source === "query" && !data\.one_time/);
  assert.match(route, /eq\("active", true\)/);
  assert.match(route, /is\("used_at", null\)/);
  assert.match(route, /active: false, used_at: now/);
  assert.match(route, /runUnifiedAgiWorkerOnce/);
  assert.match(migration, /token_hash text not null unique/);
  assert.match(migration, /revoke all on table public\.agi_runtime_tokens from public, anon, authenticated/);
  assert.doesNotMatch(route, /PREVIEW_NONCE|3933fe5dad93578/);
});

test("model routing has independent Gateway, direct-provider and local survival routes", async () => {
  const router = await read("src/lib/agi-model-router.ts");
  const gateway = await read("src/lib/agi-model-providers/vercel-gateway.ts");
  const openai = await read("src/lib/agi-model-providers/openai.ts");
  const gemini = await read("src/lib/agi-model-providers/gemini.ts");
  const anthropic = await read("src/lib/agi-model-providers/anthropic.ts");
  const ollama = await read("src/lib/agi-model-providers/ollama.ts");

  assert.match(router, /"vercel-gateway"/);
  assert.match(router, /"openai-direct"/);
  assert.match(router, /"gemini-direct"/);
  assert.match(router, /"anthropic-direct"/);
  assert.match(router, /"ollama"/);
  assert.match(gateway, /https:\/\/ai-gateway\.vercel\.sh\/v1\/chat\/completions/);
  assert.match(openai, /api\.openai\.com\/v1\/responses/);
  assert.match(openai, /store: false/);
  assert.match(gemini, /generativelanguage\.googleapis\.com/);
  assert.match(anthropic, /api\.anthropic\.com\/v1\/messages/);
  assert.match(ollama, /OLLAMA_BASE_URL/);
});

test("Vercel Functions propagate runtime OIDC to the unified model router", async () => {
  const workersRoute = await read("src/app/api/agi/workers/route.ts");
  const triggerRoute = await read("src/app/api/agi/serverless-worker-trigger/route.ts");
  const chatRoute = await read("src/app/api/nova/chat/route.ts");
  const gateway = await read("src/lib/agi-model-providers/vercel-gateway.ts");

  assert.match(gateway, /oidc_token/);
  assert.match(gateway, /VERCEL_OIDC_TOKEN/);
  for (const route of [workersRoute, triggerRoute, chatRoute]) {
    assert.match(route, /req\.headers\.get\("x-vercel-oidc-token"\)/);
    assert.match(route, /oidc_token:/);
  }
});

test("chat authenticates membership, uses one durable turn identity and keeps compatibility timeout bounded", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  assert.match(route, /requireProjectRole\(parsed\.data\.project_id, \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(route, /user_id: chatCtx\.user\.id/);
  assert.match(route, /const requestThreadId = parsed\.data\.thread_id \?\? randomUUID\(\)/);
  assert.match(route, /const requestTraceId = randomUUID\(\)/);
  assert.match(route, /controller\.abort\(\), 8_000/);
  assert.match(route, /memory_import_failed/);
});

test("new chat persistence is canonical in agi_sessions/agi_messages and legacy sync is post-turn", async () => {
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  const store = await read("src/lib/agi-session-store.ts");
  const migration = await read("supabase/migrations/20260816215830_unified_agi_sessions.sql");

  assert.match(runtime, /ensureAgiSession/);
  assert.match(runtime, /message_key: `\$\{traceId\}:user`/);
  assert.match(runtime, /message_key: `\$\{traceId\}:assistant`/);
  assert.match(runtime, /syncAgiTurnToLegacyNova/);
  assert.match(store, /persistDedicatedNovaFallbackTurn/);
  assert.match(migration, /create table if not exists public\.agi_sessions/);
  assert.match(migration, /create table if not exists public\.agi_messages/);
  assert.match(migration, /sync_agi_turn_to_legacy_nova/);
  assert.doesNotMatch(migration, /drop\s+table\s+.*nova_(threads|messages)/i);
});

test("verified run startup and completion remain service-only atomic contracts", async () => {
  const runtime = await read("src/lib/unified-agi-runtime.ts");
  const startMigration = await read("supabase/migrations/20260803004413_start_serverless_agi_execution.sql");
  const completeMigration = await read("supabase/migrations/20260803003709_atomic_serverless_agi_completion.sql");

  const completionPosition = runtime.indexOf("const completion = await completeAgi");
  const runStartPosition = runtime.indexOf("runId = await startVerifiedRun");
  assert.ok(completionPosition >= 0 && runStartPosition > completionPosition);
  assert.match(runtime, /complete_serverless_agi_execution/);
  assert.doesNotMatch(runtime, /from\("agi_runs"\)\s*\.insert/);
  assert.match(startMigration, /VERIFIED_WORKER_ID_REQUIRED/);
  assert.match(startMigration, /VERIFIED_PROVIDER_REQUIRED/);
  assert.match(startMigration, /VERIFIED_MODEL_REQUIRED/);
  assert.match(startMigration, /VERIFIED_TASK_NOT_OWNED/);
  assert.match(completeMigration, /VERIFIED_RESULT_HASH_REQUIRED/);
  assert.match(completeMigration, /VERIFIED_EVIDENCE_REQUIRED/);
  assert.match(completeMigration, /VERIFIED_RUN_NOT_OWNED_OR_INCOMPLETE/);
});

test("legacy serverless runtime stays available only as rollback/compatibility code", async () => {
  const legacy = await read("src/lib/serverless-agi-runtime.ts");
  const unified = await read("src/lib/unified-agi-runtime.ts");
  const chat = await read("src/lib/unified-nova-chat-runtime.ts");

  assert.match(legacy, /runServerlessAgiWorkerOnce/);
  assert.match(legacy, /runServerlessNovaChat/);
  assert.doesNotMatch(unified, /runUnifiedNovaChat/);
  assert.match(chat, /runToolEnabledUnifiedNovaChat/);
});
