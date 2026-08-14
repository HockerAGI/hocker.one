import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGI cards expose a single-AGI manual eval control", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalControl.tsx");

  assert.match(page, /AgiEvalControl/);
  assert.match(page, /agiId=\{cert\?\.agi_id/);
  assert.match(control, /fetch\("\/api\/agi\/evals\/run"/);
  assert.match(control, /JSON\.stringify\(\{ agi_id: agiId \}\)/);
  assert.doesNotMatch(control, /run_all|agi_ids|Promise\.all/);
});

test("manual eval control explains cost shape and handles MFA step-up", async () => {
  const control = await read("src/components/agi/AgiEvalControl.tsx");

  assert.match(control, /3 pruebas/);
  assert.match(control, /3 llamadas/);
  assert.match(control, /mfa_required/);
  assert.match(control, /\/auth\/mfa\?returnTo=%2Fagis/);
  assert.match(control, /router\.refresh\(\)/);
});

test("manual eval control is explicit about pass/fail and prevents duplicate clicks", async () => {
  const control = await read("src/components/agi/AgiEvalControl.tsx");

  assert.match(control, /disabled=\{busy\}/);
  assert.match(control, /cases_passed/);
  assert.match(control, /cases_total/);
  assert.match(control, /Evaluar 3 casos/);
  assert.match(control, /Reevaluar 3 casos/);
});
