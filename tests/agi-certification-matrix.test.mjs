import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const CANONICAL_IDS = [
  "nova", "syntia", "vertx", "jurix", "curvewind", "numia", "nova_ads", "candy",
  "pro_ia", "hostia", "trackhok", "nexpa", "chido_wins", "chido_gerente", "shadows", "revia",
];

test("AGI certification matrix is evidence-based and covers all 16 canonical identities", async () => {
  const source = await read("src/lib/agi-certification.ts");
  const suites = await read("src/lib/agi-eval-suites.ts");

  assert.match(source, /AGI_CERTIFICATION_VERSION/);
  assert.match(source, /AGI_TOOL_EVAL_VERSION/);
  assert.match(source, /eval_contract_suite/);
  assert.match(source, /individual_eval_suite/);
  assert.match(source, /tool_runtime_evidence/);
  assert.match(source, /allow_actions_guarded/);
  assert.match(source, /memory_ready/);
  assert.match(source, /tools_ready/);
  assert.match(source, /runtime_evidence/);
  assert.match(source, /missing:/);
  assert.match(source, /getAgiEvalSuite/);

  for (const id of CANONICAL_IDS) {
    assert.match(suites, new RegExp(`\\b${id}\\b`), `${id} must be represented by the eval suite catalog`);
  }
});

test("certification uses effective enabled assignments instead of future tool catalog entries", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /select\("agi_id,tool_key,enabled,permission_level,policy"\)/);
  assert.match(source, /assignment\.enabled === true/);
  assert.match(source, /normalized_status/);
  assert.match(source, /implementation_status/);
  assert.match(source, /execution_enabled/);
  assert.doesNotMatch(source, /agiToolKeys\(/);
});

test("tool runtime evidence is read-only, versioned and per assigned tool", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /feedback_type", "agi_tool_eval_result"/);
  assert.match(source, /payload\.tool_eval_version === AGI_TOOL_EVAL_VERSION/);
  assert.match(source, /payload\.tool_key === assignment\.tool_key/);
  assert.match(source, /payload\.passed === true/);
  assert.match(source, /payload\.mode === "read_only"/);
  assert.match(source, /payload\.external_writes_executed === false/);
  assert.match(source, /evidence_ref/);
  assert.match(source, /assignment\.tool_key === "ai_gateway"/);
  assert.match(source, /individualEvalReady/);
});

test("certification uses the production operational view contract and Memory Mirror for memory evidence", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /type OperationalRow = \{ agi_id: string; tasks: number \| null; runs: number \| null \}/);
  assert.match(source, /select\("agi_id,tasks,runs"\)/);
  assert.match(source, /Number\(operational\?\.tasks \?\? 0\) > 0/);
  assert.match(source, /Number\(operational\?\.runs \?\? 0\) > 0/);
  assert.doesNotMatch(source, /task_count|run_count/);
  assert.doesNotMatch(source, /agi_update_feed/);
});

test("runtime eval certification requires current score-v5 suite and verifiable run references", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /AGI_EVAL_SCORING_VERSION = "score-v5"/);
  assert.match(source, /feedback_type", "agi_eval_result"/);
  assert.match(source, /payload\.suite_version !== AGI_EVAL_SUITE_VERSION/);
  assert.match(source, /payload\.scoring_version !== AGI_EVAL_SCORING_VERSION/);
  assert.match(source, /payload\.passed !== true/);
  assert.match(source, /payload\.cases_passed/);
  assert.match(source, /evidence_run_ids/);
  assert.match(source, /from\("agi_runs"\)/);
  assert.match(source, /select\("id,project_id,agi_id,status,input,output,finished_at,result_hash"\)/);
  assert.match(source, /run\.status !== "completed"/);
  assert.match(source, /run\.project_id !== projectId/);
  assert.match(source, /canonicalId\(String\(run\.agi_id \?\? ""\)\) !== agiId/);
  assert.match(source, /run\.finished_at/);
  assert.match(source, /run\.result_hash/);
  assert.match(source, /input\.eval_suite_version === AGI_EVAL_SUITE_VERSION/);
  assert.match(source, /input\.eval_scoring_version === AGI_EVAL_SCORING_VERSION/);
  assert.match(source, /output\.eval_suite_version === AGI_EVAL_SUITE_VERSION/);
  assert.match(source, /output\.eval_scoring_version === AGI_EVAL_SCORING_VERSION/);
  assert.match(source, /output\.passed === true/);
  assert.match(source, /output\.external_writes_executed === false/);
  assert.match(source, /new Set\(evidenceRunIds\)/);
});

test("AGIs page keeps certification active while presenting one clean decision-first control", async () => {
  const page = await read("src/app/agis/page.tsx");

  assert.match(page, /getAgiCertificationSnapshot/);
  assert.match(page, /AgiEvalBatchControl/);
  assert.match(page, /Pendiente:/);
  assert.match(page, /Pruebas vigentes para su alcance actual/);
  assert.match(page, /toolEvalPendingAgiIds/);
  assert.match(page, /check !== "tool_runtime_evidence" \|\| toolEvalPendingAgiIds\.has/);
  assert.match(page, /<details/);
  assert.doesNotMatch(page, /eval contractual|eval runtime|herramientas probadas/i);
  assert.doesNotMatch(page, /evidence_percent|Worker:|Estado de catálogo:/);
  assert.doesNotMatch(page, /href=\"\/agi-certification\"/);
});

test("Hocker Ads is no longer reported as an application that does not exist", async () => {
  const operational = await read("src/lib/hocker-operational-state.ts");
  assert.doesNotMatch(operational, /\["hocker-ads",\s*"Hocker Ads",\s*"Aplicaci[oó]n de publicidad a[uú]n no creada\."\]/);
  assert.match(operational, /key:\s*"hocker-ads"[\s\S]*?status:\s*"configured"/);
  assert.match(operational, /repository:\s*"HockerAGI\/hocker\.ads"/);
  assert.match(operational, /sin deployment productivo verificado/i);
});
