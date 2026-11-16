import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("HOSTIA Free-only canary starts atomically under Owner scope, daily uniqueness and queue lock", async () => {
  const sql = await read("supabase/migrations/20261116045906_free_readonly_hostia_specialist_v1.sql");
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.start_free_readonly_hostia_pilot_v1/);
  assert.match(sql, /p_owner_id uuid/);
  assert.match(sql, /m\.role = 'owner'/);
  assert.match(sql, /a\.agi_id='hostia'/);
  assert.match(sql, /a\.allow_actions IS FALSE/);
  assert.match(sql, /v_agents <> 16 OR v_actions <> 0/);
  assert.match(sql, /t\.status IN \('queued','pending','working'\)/);
  assert.match(sql, /v_key text := 'free-specialist-v1:' \|\|/);
  assert.match(sql, /FREE_SPECIALIST_ALREADY_RUN_TODAY/);
  assert.match(sql, /'working','normal','analysis'/);
  assert.match(sql, /'hostia','hostia'/);
  assert.match(sql, /p_owner_id,false,'draft_only'/);
  assert.match(sql, /1,1,v_key/);
  assert.match(sql, /INSERT INTO public\.agi_runs/);
  assert.match(sql, /INSERT INTO public\.events/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.start_free_readonly_hostia_pilot_v1\(text,uuid,text\)/);
  assert.match(sql, /FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.start_free_readonly_hostia_pilot_v1\(text,uuid,text\)[\s\S]*TO service_role/);
  const executableSql = sql.split("\n").filter((line) => !line.trimStart().startsWith("--")).join("\n");
  assert.doesNotMatch(executableSql, /claim_next_agi_task|DELETE FROM|TRUNCATE|ON CONFLICT DO UPDATE/);
});

test("HOSTIA uses the existing Owner MFA, same-origin, Cloudflare-only route without fallback", async () => {
  const [route, provider, policy] = await Promise.all([
    read("src/app/api/agi/free-pilot/route.ts"),
    read("src/lib/agi-model-providers/cloudflare-workers-ai.ts"),
    read("src/lib/cloudflare-zero-credit-policy.ts"),
  ]);
  const owner = route.indexOf("await requireOwnerAal2Api(PROJECT_ID)", route.indexOf("export async function POST"));
  const origin = route.indexOf("if (!sameOrigin)");
  const confirmed = route.indexOf("PilotRequest.safeParse");
  const config = route.indexOf("if (!pilotConfigured())");
  const backlog = route.indexOf("await assertAgiBacklogReviewed(PROJECT_ID)");
  const start = route.indexOf('"start_free_readonly_hostia_pilot_v1"');
  const inference = route.indexOf("cloudflareWorkersAiProvider.complete(");
  assert.ok(owner >= 0 && origin > owner && confirmed > origin && config > confirmed &&
    backlog > config && start > backlog && inference > start);
  assert.match(route, /agent: z\.enum\(\["nova", "hostia"\]\)\.default\("nova"\)/);
  assert.match(route, /HOCKER_AGI_CANON\.find/);
  assert.match(route, /hostia\?\.role/);
  assert.match(route, /hostia\?\.domain/);
  assert.match(route, /workerId = \(agent === "hostia" \? "hocker-free-specialist:"/);
  assert.match(route, /free_only: true/);
  assert.match(route, /tools: \[\]/);
  assert.match(route, /web_search: false/);
  assert.match(route, /completion\.model !== CF_FREE_MODEL/);
  assert.match(route, /complete_serverless_agi_execution/);
  assert.match(route, /fail_agi_task/);
  assert.match(route, /verified_facts_only: false/);
  assert.match(route, /material_actions_executed: 0, tools_executed: 0, no_paid_fallback: true/);
  assert.doesNotMatch(route, /runUnifiedAgiWorkerOnce\s*\(|\.rpc\s*\(\s*["']claim_next_agi_task|completeAgi\s*\(|AI_GATEWAY_API_KEY|openai-direct|vercel-gateway/);
  assert.match(provider, /max_tokens: CF_MAX_OUTPUT_TOKENS/);
  assert.match(provider, /"cf-aig-max-attempts": "1"/);
  assert.match(policy, /AGI_FREE_READONLY_PILOT_ENABLED === "true"/);
});

test("HOSTIA UI uses one existing AAL2 pilot panel, requires confirmation and preserves NOVA record", async () => {
  const [ui, route, page] = await Promise.all([
    read("src/components/workers/FreeReadonlyPilotPanel.tsx"),
    read("src/app/api/agi/free-pilot/route.ts"),
    read("src/app/workers/page.tsx"),
  ]);
  assert.match(page, /FreeReadonlyPilotPanel/);
  assert.match(ui, /executePilot\(agent: "nova" \| "hostia"\)/);
  assert.match(ui, /window\.confirm/);
  assert.match(ui, /JSON\.stringify\(\{ project_id: "hocker-one", confirm: true, agent \}\)/);
  assert.match(ui, /executePilot\("nova"\)/);
  assert.match(ui, /executePilot\("hostia"\)/);
  assert.match(ui, /specialist_ready_for_single_owner_pilot/);
  assert.match(ui, /state\.specialist_task\.output\?\.summary/);
  assert.match(ui, /Autorizar prueba HOSTIA \(MFA\)/);
  assert.match(route, /specialist_task: specialist\.data \?\? null/);
  assert.match(route, /todayKey\("hostia"\)/);
  assert.match(route, /todayKey\("nova"\)/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML|setInterval|autoRun/);
});

test("a bounded specialist canary cannot masquerade as the generic worker's verified heartbeat", async () => {
  const source = await read("src/lib/serverless-agi-runtime.ts");
  const start = source.indexOf("export function isVerifiedSpecialistWorkerRun(");
  const end = source.indexOf("export async function getServerlessAgiWorkerStatus(", start);
  assert.ok(start > 0 && end > start);
  const js = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const fakeModule = { exports: {} };
  vm.runInNewContext(js, { exports: fakeModule.exports, module: fakeModule });
  const checker = fakeModule.exports.isVerifiedSpecialistWorkerRun;
  const worker_id = "hocker-free-specialist:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const evidence = [{
    kind: "verified_model_completion", worker_id,
    output_sha256: "a".repeat(64), external_writes_executed: false,
  }];
  assert.equal(checker({
    status: "completed", worker_id, provider: "cloudflare-workers-ai",
    model: "@cf/zai-org/glm-4.7-flash", result_hash: "a".repeat(64), evidence,
  }), false);
});
