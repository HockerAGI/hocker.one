import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("observer reads real bounded state but cannot claim work, publish memory or invoke a model", async () => {
  const code = await read("src/lib/nova-zero-credit-snapshot.ts");
  for (const table of ["agi_agents", "agi_tasks", "agi_memory_mirror", "agi_runs", "llm_usage", "nodes", "owner_gate_approvals"]) {
    assert.ok(code.includes('.from("' + table + '")'));
  }
  assert.match(code, /read_only_zero_credit_observation/);
  assert.doesNotMatch(code, /\.(?:rpc|insert|upsert|update|delete)\s*\(/);
  assert.doesNotMatch(code, /fetch\s*\(|ai-gateway\.vercel\.sh|runUnifiedAgiWorkerOnce/);
  assert.match(code, /ready_for_unattended_material_execution: false/);
  assert.match(code, /auto_replayed: 0/);
  assert.match(code, /SNAPSHOT_CAPPED_NOT_COMPLETE/);
});

test("observations are authenticated before any admin SELECT and do not expose POST", async () => {
  const code = await read("src/app/api/nova/zero-credit/status/route.ts");
  assert.match(code, /requireProjectRole\("hocker-one", \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(code, /getNovaZeroCreditSnapshot\(\)/);
  assert.doesNotMatch(code, /export async function POST/);
});

test("existing daily cron remains the sole scheduler and its writes remain gated", async () => {
  const code = await read("src/app/api/context-bridge/reconcile/route.ts");
  const vercel = JSON.parse(await read("vercel.json"));
  assert.deepEqual(vercel.crons, [{ path: "/api/context-bridge/reconcile", schedule: "17 8 * * *" }]);
  assert.match(code, /getNovaZeroCreditSnapshot/);
  assert.match(code, /zero_credit_observation:/);
  assert.match(code, /manifest_activated: false/);
  assert.match(code, /external_mutations: false/);
  assert.match(code, /timingSafeEqual/);
});
