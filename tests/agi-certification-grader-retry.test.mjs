import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("semantic grader availability failures remain resumable certification infrastructure errors", async () => {
  const runner = await readFile(new URL("../src/lib/agi-certification-runner.ts", import.meta.url), "utf8");

  assert.match(
    runner,
    /AGI_EVAL_(?:OWNER_GATE_)?GRADER_UNAVAILABLE/,
    "grader availability must be classified as resumable",
  );
  assert.doesNotMatch(
    runner,
    /GRADER_INVALID_VERDICT.*temporar/i,
    "invalid semantic verdicts must not become retryable",
  );
});
