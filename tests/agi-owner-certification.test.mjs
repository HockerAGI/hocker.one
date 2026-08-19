import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner certification is one resumable ceremony through one protected endpoint", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");
  assert.match(control, /fetch\("\/api\/agi\/certification\/run"/);
  assert.doesNotMatch(control, /fetch\("\/api\/agi\/evals\/run"|fetch\("\/api\/agi\/tools\/eval"/);
});

test("certification endpoint derives the next step server-side under Owner AAL2", async () => {
  const route = await read("src/app/api/agi/certification/run/route.ts");
  const runner = await read("src/lib/agi-certification-runner.ts");
  assert.match(route, /requireOwnerAal2Api\("hocker-one"\)/);
  assert.match(route, /runAgiCertificationStep/);
  assert.match(runner, /getAgiCertificationSnapshot/);
  assert.match(runner, /runtime_eval_targets\[0\]/);
  assert.match(runner, /tool_eval_targets\[0\]/);
  assert.match(runner, /runAgiEvalSuite/);
  assert.match(runner, /runAgiReadOnlyToolProbe/);
  assert.doesNotMatch(runner, /Promise\.all|Promise\.allSettled/);
});

test("eval certification retries fast transient provider failures and resumes completed cases", async () => {
  const runner = await read("src/lib/agi-runtime-eval-runner.ts");
  assert.match(runner, /AGI_EVAL_TRANSIENT_MAX_ATTEMPTS/);
  assert.match(runner, /isTransientEvalError/);
  assert.match(runner, /429|rate|quota|5\d\d/i);
  assert.match(runner, /await sleep\(/);
  assert.match(runner, /loadReusableEvalCases/);
  assert.match(runner, /reused_case/);
});

test("ceremony-level retry treats provider timeouts as transient after paced delay", async () => {
  const runner = await read("src/lib/agi-certification-runner.ts");
  assert.match(runner, /function isTransientCertificationError/);
  assert.match(runner, /timeout\|timed out/);
  assert.match(runner, /TRANSIENT_RETRY_DELAY_MS = 20_000/);
  assert.match(runner, /retryable \? TRANSIENT_RETRY_DELAY_MS : 0/);
});
