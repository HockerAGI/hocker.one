import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("one daily real pilot is atomic and never enters the generic queued claim", async () => {
  const sql = await read("supabase/migrations/20261115093001_free_readonly_agi_pilot_v1.sql");
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
  const policy = await read("src/lib/cloudflare-zero-credit-policy.ts");
  const owner = code.indexOf("await requireOwnerAal2Api(PROJECT_ID)");
  const conf = code.indexOf("if (!pilotConfigured())", code.indexOf("export async function POST"));
  const backlog = code.indexOf("await assertAgiBacklogReviewed(PROJECT_ID)");
  const db = code.indexOf('"start_free_readonly_agi_pilot_v1"');
  assert.ok(owner >= 0 && conf > owner && backlog > conf && db > backlog);
  assert.match(policy, /AGI_FREE_READONLY_PILOT_ENABLED === "true"/);
  assert.match(code, /cloudflareFreePilotConfigured\(\)/);
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

test("NOVA read-only pilot distinguishes empty queue from inactive AGIs and protects allow_actions", async () => {
  const route = await read("src/app/api/agi/free-pilot/route.ts");
  assert.match(route, /cola sin tareas pendientes NO demuestra/);
  assert.match(route, /allow_actions=false protege acciones materiales/);
  assert.match(route, /Nunca recomiendes cambiar allow_actions a true/);
  assert.match(route, /separa hechos de inferencias/);
  assert.match(route, /verified_facts_only: false/);
  assert.match(route, /tools_executed: 0/);
  assert.match(route, /no_paid_fallback: true/);
  assert.match(route, /autonomous_dispatch_enabled: false/);
});

test("Owner re-opening Workers sees the existing real pilot response, with escaped mobile formatting", async () => {
  const route = await read("src/app/api/agi/free-pilot/route.ts");
  const ui = await read("src/components/workers/FreeReadonlyPilotPanel.tsx");
  assert.match(route, /\.select\("id,status,created_at,completed_at,result_hash,error,output"\)/);
  assert.match(route, /await requireOwnerAal2Api\(PROJECT_ID\)/);
  assert.match(ui, /state\?\.task\?\.status === "completed"/);
  assert.match(ui, /state\.task\.output\?\.summary/);
  assert.match(ui, /function PilotSummary/);
  assert.match(ui, /summary\.split\(\/\\r\?\\n\/\)/);
  assert.match(ui, /inlineEmphasis/);
  assert.match(ui, /el texto generado por NOVA no es un diagnóstico operativo certificado/);
  assert.match(ui, /No lo habilites globalmente/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML|innerHTML|<iframe/);
  assert.match(ui, /window\.confirm/);
  assert.doesNotMatch(ui, /setInterval|autoRun|onMount.*POST/);
});
