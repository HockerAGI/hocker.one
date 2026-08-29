import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("semantic grader availability failures remain resumable certification infrastructure errors", async () => {
  const runner = await readFile(new URL("../src/lib/agi-certification-runner.ts", import.meta.url), "utf8");
  const matcher = runner.match(/return \/(.+)\/i\.test\(message\);/);
  assert.ok(matcher?.[1], "certification transient matcher must be present");

  assert.match(
    matcher[1],
    /AGI_EVAL_\(\?:OWNER_GATE_\)\?GRADER_UNAVAILABLE/,
    "grader availability must be classified as resumable",
  );
  assert.doesNotMatch(
    matcher[1],
    /GRADER_INVALID_VERDICT/,
    "invalid semantic verdicts must remain hard stops",
  );
});
