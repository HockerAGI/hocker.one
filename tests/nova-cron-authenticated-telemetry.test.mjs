import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const prefix = "src/app/api/internal/";

test("read-only coordinator emits a fixed, authenticated, count-only production audit", async () => {
  const route = await source(prefix + "nova-coordinator/route.ts");
  const authPos = route.indexOf("if (!authenticated(req))");
  const emitPos = route.indexOf('event: "nova_coordinator_authenticated_observation"');
  assert.ok(authPos >= 0 && emitPos > authPos);
  assert.match(route, /outcome: "ok"/);
  assert.match(route, /agents: agents\.count/);
  assert.match(route, /queue: tasks\.count/);
  assert.match(route, /material_actions: actions\.count/);
  assert.match(route, /model_requests: 0, task_claims: 0/);
  assert.doesNotMatch(route, /console\.(info|warn|error)\((?:req|request|error|process\.env)\b/);
  assert.doesNotMatch(route, /JSON\.stringify\(req\)|JSON\.stringify\(request\)/);
  assert.doesNotMatch(route, /\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
});

test("inventory telemetry is only reached after independent token and fixed JSON contract", async () => {
  const route = await source(prefix + "nova-free-inventory/route.ts");
  const authPos = route.indexOf("if (!authorized(request))");
  const contractPos = route.indexOf("!Body.safeParse(");
  const emitted = route.indexOf('event: "nova_free_inventory_authenticated_tick"');
  assert.ok(authPos >= 0 && contractPos > authPos && emitted > contractPos);
  assert.match(route, /outcome: data\.reason/);
  assert.match(route, /outcome: "one_inventory_completed"/);
  assert.match(route, /outcome: "deployment_sha_unavailable"/);
  assert.match(route, /model_requests: 0, task_claims: 0/);
  assert.doesNotMatch(route, /console\.(info|warn|error)\((?:req|request|error|process\.env)\b/);
  assert.doesNotMatch(route, /JSON\.stringify\(request\)|JSON\.stringify\(token\)|Authorization:.*console/);
  assert.match(route, /run_owner_free_inventory_v1/);
  assert.doesNotMatch(route, /runUnifiedAgiWorkerOnce|claim_next_agi_task|modelRouter|tools:\s*\[/);
});

test("production Cron code still makes exactly a fixed count-only observation before inventory", async () => {
  const worker = await source("infra/cloudflare/nova-coordinator/index.mjs");
  assert.match(worker, /const status = await observe\(env\)/);
  assert.match(worker, /if \(env\.NOVA_FREE_INVENTORY_ENABLED === "true"\)/);
  assert.match(worker, /const result = await processOneApprovedInventory\(env\)/);
  assert.match(worker, /coordinator_observation/);
  assert.match(worker, /owner_approved_free_inventory_tick/);
  assert.doesNotMatch(worker, /CLOUDFLARE_WORKERS_AI_API_TOKEN|claim_next_agi_task/);
});
