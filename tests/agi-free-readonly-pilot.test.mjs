import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("one daily real pilot is atomic and never enters the generic queued claim", async () => {
  const sql = await read("supabase/migrations/20261115093000_free_readonly_agi_pilot_v1.sql");
  assert.match(sql, /start_free_readonly_agi_pilot_v1/);
  assert.match(sql, /v_key := 'free-pilot-v1:' \|\| v_date/);
  assert.match(sql, /'working','normal','analysis'/);
  assert.match(sql, /'nova','nova'/);
  assert.match(sql, /'draft_only'/);
  assert.match(sql, /v_agents <> 16 OR v_actions <> 0/);
  assert.match(sql, /v_queued <> 0/);
  assert.match(sql, /project_members m/);
  assert.match(sql, /m.role = 'owner'/);
  assert.match(sql, /INSERT INTO public\.agi_runs/);
  assert.match(sql, /INSERT INTO public\.events/);
  assert.match(sql, /REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION[\s\S]+TO service_role/);
  assert.doesNotMatch(sql, /DELETE FROM|TRUNCATE|claim_next_agi_task/);
});

test("Owner AAL2 and hard-disabled-by-default model route must precede atomic DB start", async () => {
  const code = await read("src/app/api/agi/free-pilot/route.ts");
  const owner = code.indexOf("await requireOwnerAal2Api(PROJECT_ID)");
  const conf = code.indexOf("if (!pilotConfigured())", code.indexOf("export async function POST"));
  const backlog = code.indexOf("await assertAgiBacklogReviewed(PROJECT_ID)");
  const db = code.indexOf('"start_free_readonly_agi_pilot_v1"');
  assert.ok(owner >= 0 && conf > owner && backlog > conf && db > backlog);
  assert.match(code, /AGI_FREE_READONLY_PILOT_ENABLED === "true"/);
  assert.match(code, /cloudflareFreeRouteConfigured\(\)/);
  assert.match(code, /z\.literal\(true\)/);
  assert.match(code, /z\.literal\("hocker-one"\)/);
  assert.match(code, /cloudflareWorkersAiProvider\.complete/);
  assert.match(code, /free_only: true/);
  assert.match(code, /tools: \[\]/);
  assert.match(code, /web_search: false/);
  assert.match(code, /complete_serverless_agi_execution/);
  assert.match(code, /fail_agi_task/);
  assert.match(code, /material_actions_executed: 0/);
  // Do not confuse explanatory comments with actual unsafe function calls.
  assert.doesNotMatch(code, /\.rpc\s*\(\s*["\x27]claim_next_agi_task|runUnifiedAgiWorkerOnce\s*\(|completeAgi\s*\(|executeAgiMcpToolCalls\s*\(|AI_GATEWAY_API_KEY|openai-direct|vercel-gateway/);
});

test("worker UI exposes only an explicit human-confirmed pilot", async () => {
  const code = await read("src/components/workers/FreeReadonlyPilotPanel.tsx");
  const page = await read("src/app/workers/page.tsx");
  assert.match(page, /FreeReadonlyPilotPanel/);
  assert.match(code, /window\.confirm/);
  assert.match(code, /confirm: true/);
  assert.match(code, /\/api\/agi\/free-pilot/);
  assert.doesNotMatch(code, /setInterval|autoRun|onMount.*POST/);
});
