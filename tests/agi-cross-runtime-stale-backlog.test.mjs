import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Hocker One and dedicated nova.agi agree on project-scoped stale backlog policy", async () => {
  const guard = await read("src/lib/agi-stale-backlog-gate.ts");
  assert.match(guard, /24 \* 60 \* 60 \* 1000/);
  assert.match(guard, /AGI_WORKER_STALE_BACKLOG_REQUIRES_REVIEW/);
  assert.match(guard, /AGI_WORKER_BACKLOG_PREFLIGHT_UNAVAILABLE/);
  assert.match(guard, /\.select\("id", \{ head: true, count: "exact" \}\)/);
  assert.match(guard, /\.eq\("project_id", projectId\)/);
  assert.match(guard, /\.in\("status", \["queued", "pending"\]\)/);
  assert.match(guard, /\.lt\("created_at", cutoff\)/);
  assert.match(guard, /if \(error \|\| typeof count !== "number"/);
  assert.doesNotMatch(guard, /\.(?:insert|upsert|update|delete|rpc)\s*\(/);
  assert.match(guard, /stale_count: null/);
  assert.match(guard, /checked: false[\s\S]*blocked: true/);
});

test("all Hocker One worker claims and recovery paths block before any mutating RPC", async () => {
  const [unified, legacy, trigger] = await Promise.all([
    read("src/lib/unified-agi-runtime.ts"),
    read("src/lib/serverless-agi-runtime.ts"),
    read("src/app/api/agi/serverless-worker-trigger/route.ts"),
  ]);
  const once = unified.slice(unified.indexOf("export async function runUnifiedAgiWorkerOnce("));
  assert.ok(
    once.indexOf("await assertAgiBacklogReviewed(params.project_id)") >= 0 &&
    once.indexOf("await assertAgiBacklogReviewed(params.project_id)") < once.indexOf('"claim_next_agi_task"'),
    "unified worker must verify before task claim",
  );
  const legacyOnce = legacy.slice(legacy.indexOf("export async function runServerlessAgiWorkerOnce("));
  assert.ok(
    legacyOnce.indexOf("await assertAgiBacklogReviewed(params.project_id)") >= 0 &&
    legacyOnce.indexOf("await assertAgiBacklogReviewed(params.project_id)") < legacyOnce.indexOf('"claim_next_agi_task"'),
    "legacy worker must verify before task claim",
  );
  const recover = legacy.slice(
    legacy.indexOf("export async function recoverStaleServerlessAgiTasks("),
    legacy.indexOf("export async function getServerlessAgiWorkerStatus("),
  );
  assert.ok(
    recover.indexOf("await assertAgiBacklogReviewed(projectId)") >= 0 &&
    recover.indexOf("await assertAgiBacklogReviewed(projectId)") < recover.indexOf('"recover_stale_agi_tasks"'),
    "recovery cannot rewrite old locks prior to the preflight",
  );
  assert.match(trigger, /runUnifiedAgiWorkerOnce/);
  assert.match(trigger, /AGI_STALE_BACKLOG_BLOCK_CODE/);
  assert.match(trigger, /status: error\.message === AGI_STALE_BACKLOG_BLOCK_CODE \? 409 : 503/);
  assert.doesNotMatch(trigger, /ZERO_CREDIT_SERVERLESS_GATEWAY_DISABLED.*return.*claim_next_agi_task/);
});

test("real Owner MFA AAL2 is required for manual worker processing and recovery", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");
  assert.match(route, /requireProjectRole\(action\.project_id, \["owner"\]\)/);
  assert.match(route, /requireOwnerAal2Api\(ctx\.project_id\)/);
  assert.match(route, /if \(!ownerGate\.ok\) return ownerGate\.response/);
  assert.ok(
    route.indexOf("requireOwnerAal2Api(ctx.project_id)") <
      route.indexOf("runUnifiedAgiWorkerOnce({"),
  );
  assert.ok(
    route.indexOf("requireOwnerAal2Api(ctx.project_id)") <
      route.indexOf("recoverStaleServerlessAgiTasks(ctx.project_id)"),
  );
  assert.match(route, /AGI_STALE_BACKLOG_BLOCK_CODE \? 409 : 503/);
  assert.match(route, /executed: false/);
});

test("console shows exact count/read errors and disables dangerous buttons, not task review", async () => {
  const [runtime, panel] = await Promise.all([
    read("src/lib/unified-agi-runtime.ts"),
    read("src/components/workers/VerifiableWorkersConsole.tsx"),
  ]);
  assert.match(runtime, /const backlog = await inspectAgiBacklog\(projectId\)/);
  assert.match(runtime, /ready: schemaReady && routes\.length > 0 && !backlog\.blocked/);
  assert.match(runtime, /stale_backlog: backlog/);
  assert.match(runtime, /execution_blocked: backlog\.blocked/);
  assert.match(panel, /NOVA no procesará trabajos antiguos automáticamente/);
  assert.match(panel, /backlog\.stale_count/);
  assert.match(panel, /No se pudo comprobar toda la cola/);
  assert.match(panel, /\!schemaReady \|\| executionBlocked/);
  assert.match(panel, /operation: "run_once"/);
  assert.match(panel, /operation: "recover_stale"/);
  assert.match(panel, /Las autorizaciones de cambios sensibles se administran por separado/);
});
