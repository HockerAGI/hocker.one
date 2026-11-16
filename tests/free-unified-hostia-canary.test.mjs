import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("free unified worker exact reservation uses existing unique key and does not borrow generic queue", async () => {
  const [canary, schema] = await Promise.all([
    read("src/lib/agi-free-unified-canary.ts"),
    read("supabase/migrations/20260731173018_verifiable_agi_workers_v1.sql"),
  ]);
  assert.match(schema, /unique index if not exists agi_tasks_project_idempotency_uidx/i);
  assert.match(canary, /FREE_UNIFIED_HOSTIA_KEY = "free-unified-hostia-v1:one-time"/);
  assert.match(canary, /AGI_FREE_UNIFIED_WORKER_CANARY_ENABLED === "true"/);
  assert.match(canary, /cloudflareFreePilotConfigured/);
  assert.match(canary, /await assertAgiBacklogReviewed\(PROJECT\)/);
  assert.match(canary, /\.eq\("role", "owner"\)/);
  assert.match(canary, /agents\.data\.length !== 16/);
  assert.match(canary, /agent\.allow_actions !== false/);
  assert.match(canary, /tasks\.count !== 0 \|\| actions\.count !== 0/);
  assert.match(canary, /status: "working"/);
  assert.match(canary, /attempt_count: 1, max_attempts: 1/);
  assert.match(canary, /idempotency_key: FREE_UNIFIED_HOSTIA_KEY/);
  assert.match(canary, /lock_owner: params\.worker_id/);
  assert.doesNotMatch(canary, /claim_next_agi_task|DELETE FROM|TRUNCATE|upsert\(/);
});

test("Owner-only endpoint gates the exact canary by AAL2, same origin and explicit confirmation", async () => {
  const route = await read("src/app/api/agi/free-unified-worker/route.ts");
  const owner = route.indexOf("await requireOwnerAal2Api(PROJECT)", route.indexOf("export async function POST"));
  const origin = route.indexOf("if (!sameOrigin)", owner);
  const confirmation = route.indexOf("RequestSchema.safeParse", origin);
  const config = route.indexOf("if (!freeUnifiedHostiaConfigured())", confirmation);
  const run = route.indexOf("await runUnifiedAgiWorkerOnce", config);
  assert.ok(owner >= 0 && origin > owner && confirmation > origin && config > confirmation && run > config);
  assert.match(route, /free_only_hostia_canary: true/);
  assert.match(route, /requested_by: owner\.userId/);
  assert.doesNotMatch(route, /runServerlessAgiWorkerOnce|AGI_DELEGATION_DISPATCH_ENABLED/);
});

test("bounded one-time canary uses the existing unified worker, never provider router or tools", async () => {
  const unified = await read("src/lib/unified-agi-runtime.ts");
  const canary = unified.slice(unified.indexOf("export async function runUnifiedAgiWorkerOnce("));
  assert.match(canary, /free_only_hostia_canary\?: boolean/);
  assert.match(canary, /reserveOneFreeUnifiedHostiaTask/);
  assert.match(canary, /cloudflareWorkersAiProvider\.complete/);
  assert.match(canary, /free_only: true/);
  assert.match(canary, /tools: \[\]/);
  assert.match(canary, /web_search: false/);
  assert.match(canary, /completion\.model !== CF_FREE_MODEL/);
  assert.match(canary, /kind: freeOnlyHostia \? "verified_free_unified_model_completion"/);
  assert.match(canary, /if \(!freeOnlyHostia\) \{/);
  assert.doesNotMatch(canary, /AGI_DELEGATION_DISPATCH_ENABLED\s*=\s*"true"/);
  const checker = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(checker, /row\.kind === "verified_model_completion"/);
  assert.doesNotMatch(checker.slice(checker.indexOf("export function isVerifiedSpecialistWorkerRun("),
    checker.indexOf("export async function getServerlessAgiWorkerStatus(")), /verified_free_unified_model_completion/);
});

test("bounded canary UI is manually confirmed and not automatically triggered", async () => {
  const [panel, page] = await Promise.all([
    read("src/components/workers/FreeUnifiedWorkerCanaryPanel.tsx"),
    read("src/app/workers/page.tsx"),
  ]);
  assert.match(page, /FreeUnifiedWorkerCanaryPanel/);
  assert.match(panel, /window\.confirm/);
  assert.match(panel, /confirm: true/);
  assert.match(panel, /state\.ready_for_single_owner_execution/);
  assert.doesNotMatch(panel, /setInterval|autoRun|dangerouslySetInnerHTML/);
});
