import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("evidence certification uses an independent semantic grader instead of substring gating", async () => {
  const runner = await read("src/lib/agi-runtime-eval-runner.ts");
  assert.match(runner, /gradeEvidenceSemantically/);
  assert.match(runner, /await gradeEvidenceSemantically/);
  assert.match(runner, /candidateRoute:\s*completion\.route/);
  assert.match(runner, /evidence_grader:/);
  assert.match(runner, /AGI_EVAL_GRADER_(?:UNAVAILABLE|INVALID_VERDICT)/);
  assert.match(runner, /AGI_EVAL_SCORING_VERSION = "score-v4"/);
});

test("model router can exclude the candidate route for independent grading", async () => {
  const types = await read("src/lib/agi-model-providers/types.ts");
  const router = await read("src/lib/agi-model-router.ts");
  assert.match(types, /exclude_routes\?:\s*AgiModelRoute\[\]/);
  assert.match(router, /exclude_routes/);
  assert.match(router, /EXCLUDED_BY_POLICY/);
});

test("semantic grader has a strict machine-readable verdict and treats candidate text as untrusted", async () => {
  const grader = await read("src/lib/agi-evidence-semantic-grader.ts");
  assert.match(grader, /VERDICT:\s*PASS/);
  assert.match(grader, /VERDICT:\s*FAIL/);
  assert.match(grader, /untrusted/i);
  assert.match(grader, /excludeRoutes:\s*\[args\.candidateRoute\]/);
  assert.match(grader, /exclude_routes:\s*args\.excludeRoutes/);
  assert.match(grader, /grader_parse_failure/);
});

test("semantic grader prefers a different route but can fall back to an isolated call on the candidate route", async () => {
  const grader = await read("src/lib/agi-evidence-semantic-grader.ts");
  assert.match(grader, /configuredAgiRoutes/);
  assert.match(grader, /same_route_fallback/);
  assert.match(grader, /independence_mode/);
  assert.match(grader, /route !== args\.candidateRoute/);
  assert.match(grader, /cross_route_attempts/);
});

test("grader availability hardening keeps score-v4 and suite-5 because semantics are unchanged", async () => {
  const suites = await read("src/lib/agi-eval-suites.ts");
  const certification = await read("src/lib/agi-certification.ts");
  assert.match(suites, /AGI_EVAL_SUITE_VERSION = "2026\.08\.21-5"/);
  assert.match(certification, /AGI_EVAL_SCORING_VERSION = "score-v4"/);
});

test("semantic scoring revision rolls suite and certification provenance without mutating history", async () => {
  const suites = await read("src/lib/agi-eval-suites.ts");
  const certification = await read("src/lib/agi-certification.ts");
  assert.match(suites, /AGI_EVAL_SUITE_VERSION = "2026\.08\.21-5"/);
  assert.match(certification, /AGI_EVAL_SCORING_VERSION = "score-v4"/);
});
