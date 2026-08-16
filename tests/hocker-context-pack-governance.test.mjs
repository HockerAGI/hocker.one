import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Context Pack is evidence-driven and does not publish subjective progress estimates", async () => {
  const source = await read("src/lib/hocker-context-pack.ts");

  assert.match(source, /mode:\s*"evidence_driven"/);
  assert.match(source, /mode:\s*"observable_gates_only"/);
  assert.match(source, /aggregate_percentages_in_context_pack:\s*false/);
  assert.match(source, /No inventar porcentajes/);

  assert.doesNotMatch(source, /updated_percentages/);
  assert.doesNotMatch(source, /hocker_one_private_operational_panel/);
  assert.doesNotMatch(source, /mobile_web_ux_ui/);
  assert.doesNotMatch(source, /agi_runtime_base/);
  assert.doesNotMatch(source, /real_autonomous_agis/);
  assert.doesNotMatch(source, /complete_real_hocker_ecosystem/);
  assert.doesNotMatch(source, /current_phase/);
  assert.doesNotMatch(source, /previous_stable_phase/);
  assert.doesNotMatch(source, /next_target/);
});

test("Context Pack keeps shared-memory and execution boundaries explicit", async () => {
  const source = await read("src/lib/hocker-context-pack.ts");

  assert.match(source, /CONTEXT_BRIDGE_V1\.md/);
  assert.match(source, /PLATFORM_CLOSURE_GATE_2026-08-14\.md/);
  assert.match(source, /Owner Gate \/ agi_action_queue/);
  assert.match(source, /tokens, cookies, TOTP, KYC, PII restringida/);
  assert.match(source, /APP_REGISTRY\.length/);
  assert.match(source, /AGI_REGISTRY\.length/);
});
