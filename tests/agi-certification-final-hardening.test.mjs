import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("runtime certification executes at most one new eval case per request", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.match(source, /MAX_NEW_EVAL_CASES_PER_REQUEST\s*=\s*1/);
  assert.match(source, /pendingCases/);
  assert.match(source, /pendingCases\.slice\(0, MAX_NEW_EVAL_CASES_PER_REQUEST\)/);
  assert.doesNotMatch(source, /for \(const \[index, evalCase\] of suite\.cases\.entries\(\)\)/);
  assert.match(source, /complete:\s*boolean/);
});

test("stale recovery is exact to evaluation-only task and closes its orphan run", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");

  assert.match(source, /EVAL_STALE_AFTER_MS\s*=\s*10 \* 60 \* 1000/);
  assert.match(source, /lock_owner:\s*string \| null/);
  assert.match(source, /last_heartbeat_at:\s*string \| null/);
  assert.match(source, /locked_at:\s*string \| null/);
  assert.match(source, /payload:\s*unknown/);
  assert.match(source, /recoverExactStaleEvalTask/);
  assert.match(source, /kind:\s*"agi_eval_stale_recovery"/);
  assert.match(source, /p_task_id:\s*task\.id/);
  assert.match(source, /p_worker_id:\s*task\.lock_owner/);
  assert.match(source, /from\("agi_runs"\)[\s\S]*?\.eq\("task_id", task\.id\)[\s\S]*?\.eq\("status", "running"\)/);
  assert.doesNotMatch(source, /recover_stale_agi_tasks/);
});

test("certification probes assigned read-only tools before consuming runtime model calls", async () => {
  const source = await read("src/lib/agi-certification-runner.ts");
  const toolIndex = source.indexOf("const toolTarget = before.tool_eval_targets[0]");
  const runtimeIndex = source.indexOf("const agiId = before.runtime_eval_targets[0]");

  assert.ok(toolIndex >= 0, "tool target must exist");
  assert.ok(runtimeIndex >= 0, "runtime target must exist");
  assert.ok(toolIndex < runtimeIndex, "tool probes must fail early before runtime LLM spend");
  assert.match(source, /fetch failed|network|connection|ECONNRESET|UND_ERR/i);
});

test("browser ceremony derives its safety budget from pending work instead of fixed 64 steps", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.doesNotMatch(control, /MAX_CERTIFICATION_STEPS\s*=\s*64/);
  assert.match(control, /certificationStepBudget/);
  assert.match(control, /runtimeEvalTargets\.length \* 3/);
  assert.match(control, /toolEvalTargets\.length/);
  assert.match(control, /for \(let stepIndex = 0; stepIndex < certificationStepBudget\(/);
});
