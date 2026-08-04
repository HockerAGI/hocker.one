import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("gateway health requires evidence-backed completed runs", async () => {
  const sql = await read("supabase/migrations/20260804014500_ai_gateway_health_automation.sql");

  assert.match(sql, /verified_model_completion/);
  assert.match(sql, /input_sha256/);
  assert.match(sql, /output_sha256/);
  assert.match(sql, /external_writes_executed/);
  assert.match(sql, /result_hash.*\^\[a-f0-9\]\{64\}\$/s);
  assert.match(sql, /enabled = is_verified_success and agi_id <> 'shadows'/);
  assert.match(sql, /status = case when is_verified_success then 'connected' else 'partial' end/);
  assert.match(sql, /sync_ai_gateway_health_from_run/);
});

test("owner panel reads persisted integration state and current statuses", async () => {
  const state = await read("src/lib/agi-runtime-state.ts");
  const panel = await read("src/components/owner/AgiRuntimePreview.tsx");

  assert.match(state, /agi_integration_checks/);
  assert.match(state, /latestGatewayCheck\.status === "healthy"/);
  assert.match(state, /status = healthy \? "connected" : "partial"/);
  assert.match(panel, /getPersistedRuntimeIntegrations/);
  assert.match(panel, /missing_code/);
  assert.match(panel, /missing_key/);
  assert.match(panel, /Conectadas/);
  assert.match(panel, /Falta código/);
  assert.doesNotMatch(panel, /const configured = integrations\.filter/);
});
