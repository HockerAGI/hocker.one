import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const IDS = [
  "nova", "syntia", "vertx", "jurix", "curvewind", "numia", "nova_ads", "candy",
  "pro_ia", "hostia", "trackhok", "nexpa", "chido_wins", "chido_gerente", "shadows", "revia",
];

test("eval runner route is Owner AAL2 only, single-AGI and fail closed", async () => {
  const route = await read("src/app/api/agi/evals/run/route.ts");

  assert.match(route, /requireOwnerAal2Api/);
  assert.match(route, /runAgiEvalSuite/);
  assert.match(route, /agi_id/);
  assert.doesNotMatch(route, /agi_ids|run_all|Promise\.all/);
  assert.match(route, /status:\s*400/);
  assert.doesNotMatch(route, /\bmessage,\s*\n/);
  assert.match(route, /Runtime evaluation failed\. Review evidence and logs\./);
});

test("runtime eval runner uses the unified model router and exact owned tasks", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.match(source, /completeAgi/);
  assert.doesNotMatch(source, /callServerlessAgiModel/);
  assert.match(source, /getAgiEvalSuite/);
  assert.match(source, /from\("agi_tasks"\)/);
  assert.match(source, /idempotencyKey = `agi-eval:/);
  assert.match(source, /\.eq\("id", task\.id\)/);
  assert.match(source, /task\.status !== "queued" && task\.status !== "failed"/);
  assert.match(source, /\.eq\("status", previousStatus\)/);
  assert.doesNotMatch(source, /claim_next_agi_task/);
  assert.match(source, /start_serverless_agi_execution/);
  assert.match(source, /complete_serverless_agi_execution/);
  assert.match(source, /fail_agi_task/);
});

test("eval runner records actual unified route provenance rather than pinning a Gateway model", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.doesNotMatch(source, /AI_GATEWAY_MODEL_AUTO|AI_GATEWAY_MODEL_FAST|evalGatewayModel/);
  assert.match(source, /p_provider:\s*"hocker-model-router"/);
  assert.match(source, /p_model:\s*"dynamic"/);
  assert.match(source, /provider:\s*completion\.provider/);
  assert.match(source, /model:\s*completion\.model/);
  assert.match(source, /route:\s*completion\.route/);
  assert.match(source, /route_attempts:\s*completion\.attempts/);
});

test("every eval run carries top-level suite and case provenance", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.match(source, /eval_suite_version:\s*AGI_EVAL_SUITE_VERSION/);
  assert.match(source, /eval_case_id:\s*args\.evalCase\.id/);
  assert.match(source, /eval_kind:\s*args\.evalCase\.kind/);
  assert.match(source, /external_writes_executed:\s*false/);
  assert.match(source, /result_hash/);
});

test("eval feedback only certifies a complete three-case suite with real run IDs", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.match(source, /feedback_type:\s*"agi_eval_result"/);
  assert.match(source, /cases_total:\s*suite\.cases\.length/);
  assert.match(source, /cases_passed/);
  assert.match(source, /evidence_run_ids/);
  assert.match(source, /passed:\s*allPassed/);
  assert.match(source, /runIds\.length === suite\.cases\.length/);
});

test("Shadows may be evaluated without becoming an operational worker", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");
  const runtime = await read("src/lib/serverless-agi-runtime.ts");

  assert.match(source, /evaluation_only/);
  assert.match(source, /Shadows/i);
  assert.match(source, /requireCanonicalAgi/);
  assert.doesNotMatch(source, /isOperationalAgi/);
  assert.match(runtime, /AGI_PROFILE_NOT_OPERATIONAL/);
  assert.doesNotMatch(runtime, /evaluation_only/);
});

test("the runner recognizes exactly the canonical 16 eval identities", async () => {
  const suites = await read("src/lib/agi-eval-suites.ts");
  for (const id of IDS) {
    assert.match(suites, new RegExp(`\\b${id}\\b`));
  }
});
