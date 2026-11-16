import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Free NOVA-HOSTIA parent/child are unique, durable and linked", async () => {
  const [s, schema] = await Promise.all([
    read("src/lib/agi-free-delegation-canary.ts"),
    read("supabase/migrations/20260905192000_bound_agi_delegation_trace.sql"),
  ]);
  assert.match(s, /FREE_NOVA_HOSTIA_PARENT_KEY = "free-nova-hostia-v1:parent:one-time"/);
  assert.match(s, /FREE_NOVA_HOSTIA_CHILD_KEY = "free-nova-hostia-v1:child:one-time"/);
  assert.match(schema, /parent_run_id uuid references public\.agi_runs/i);
  assert.match(s, /parent_run_id: isChild \? input\.parentRunId : null/);
  assert.match(s, /delegation_depth: isChild \? 1 : 0/);
  assert.match(s, /parentOut\.verified_execution !== true/);
  assert.match(s, /proof\.output_sha256 !== r\.result_hash/);
  assert.match(s, /sha256\(parentOut\) !== r\.result_hash/);
  assert.match(s, /r\.result_hash !== input\.parentExpectedHash/);
  assert.match(s, /proof\.run_id !== r\.id/);
  assert.match(s, /function canonicalize\(value: unknown\)/);
  assert.match(s, /parentTask\.data\.result_hash !== r\.result_hash/);
  assert.match(s, /parentOut\.requested_by !== input\.ownerId/);
  assert.match(s, /attempt_count: 1, max_attempts: 1/);
  assert.match(s, /"complete_serverless_agi_execution"/);
  assert.match(s, /"start_serverless_agi_execution"/);
  assert.doesNotMatch(s, /claim_next_agi_task|upsert\(|delete\(|run_once/);
});
test("Free-only two-step route preserves Owner MFA and material-action Queue Lock", async () => {
  const [s,r] = await Promise.all([
    read("src/lib/agi-free-delegation-canary.ts"),
    read("src/app/api/agi/free-nova-hostia-delegation/route.ts"),
  ]);
  assert.match(s, /AGI_FREE_NOVA_HOSTIA_DELEGATION_CANARY_ENABLED === "true"/);
  assert.match(s, /cloudflareFreePilotConfigured\(\)/);
  assert.match(s, /AGI_QUEUE_BLOCKING_STATUSES/);
  assert.match(s, /tasks\.count !== 0 \|\| actions\.count !== 0/);
  assert.match(s, /await requireOwnerAal2Api\(PROJECT\)/);
  assert.match(r, /await requireOwnerAal2Api\(PROJECT\)/);
  assert.match(r, /if \(!sameOrigin\)/);
  assert.match(r, /confirm: z\.literal\(true\)/);
  assert.match(r, /runOneFreeNovaHostiaDelegation\(owner\.userId\)/);
});
test("Two actual direct Cloudflare model calls are parent first and child second", async () => {
  const s = await read("src/lib/agi-free-delegation-canary.ts");
  assert.match(s, /cloudflareWorkersAiProvider\.complete\(/);
  assert.match(s, /timeout_ms: 20_000, free_only: true, tools: \[\], web_search: false/);
  assert.match(s, /result\.provider !== PROVIDER \|\| result\.route !== PROVIDER/);
  assert.match(s, /result\.model !== CF_FREE_MODEL/);
  assert.match(s, /!result\.text\.trimEnd\(\)\.endsWith\(TERMINATOR\)/);
  assert.match(s, /const parent = await performStep\("nova", ownerId\)/);
  assert.match(s, /const child = await performStep\("hostia", ownerId, parent\.run_id, parent\.result_hash\)/);
  assert.match(s, /no_autonomous_dispatch: true/);
  assert.doesNotMatch(s, /completeAgi\(|AGI_DELEGATION_DISPATCH_ENABLED|allow_actions: true/);
});
test("UI requires one manual confirmation and never repeats on mount", async () => {
  const [s,p] = await Promise.all([
    read("src/components/workers/FreeNovaHostiaDelegationPanel.tsx"),
    read("src/app/workers/page.tsx"),
  ]);
  assert.match(s, /window\.confirm/);
  assert.match(s, /state\?\.can_authorize/);
  assert.match(s, /confirm: true/);
  assert.match(p, /FreeNovaHostiaDelegationPanel/);
  assert.doesNotMatch(s, /setInterval|setTimeout|autoRun|dangerouslySetInnerHTML/);
});

test("General Workers API redacts both sensitive model outputs and evidence for Free delegation tasks", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");
  assert.match(route, /idempotency_key/);
  assert.match(route, /startsWith\("free-nova-hostia-v1:"\)/);
  assert.match(route, /output: privateDelegation \? \{ redacted: true, result_hash: row\.result_hash \} : row\.output/);
  assert.match(route, /evidence: privateDelegation \? \[\] : row\.evidence/);
  assert.match(route, /idempotency_key: undefined/);
});
