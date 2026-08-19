import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGIs page exposes a separate Owner batch certification control", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(page, /AgiEvalBatchControl/);
  assert.match(page, /agiIds=\{certification\.entries\.map\(\(entry\) => entry\.agi_id\)\}/);
  assert.match(page, /runtimeEvalTargets=\{certification\.runtime_eval_targets\}/);
  assert.match(page, /toolEvalTargets=\{certification\.tool_eval_targets\}/);
  assert.match(control, /type AgiEvalBatchControlProps/);
  assert.match(control, /agiIds: string\[\]/);
  assert.match(control, /runtimeEvalTargets: string\[\]/);
  assert.match(control, /toolEvalTargets: ToolEvalTarget\[\]/);
  assert.match(control, /agiIds\.length !== 16/);
  assert.match(control, /new Set\(agiIds\)\.size !== 16/);
});

test("certification snapshot derives resumable runtime and supported read-only tool targets", async () => {
  const certification = await read("src/lib/agi-certification.ts");

  assert.match(certification, /runtime_eval_targets/);
  assert.match(certification, /tool_eval_targets/);
  assert.match(certification, /tool_key === "supabase" \|\| assignment\.tool_key === "github"/);
  assert.match(certification, /!hasVerifiedToolAssignmentEvidence/);
});

test("batch certification reuses protected endpoints sequentially", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /for \(const agiId of runtimeEvalTargets\)/);
  assert.match(control, /fetch\("\/api\/agi\/evals\/run"/);
  assert.match(control, /JSON\.stringify\(\{ agi_id: agiId \}\)/);
  assert.match(control, /for \(const target of toolEvalTargets\)/);
  assert.match(control, /fetch\("\/api\/agi\/tools\/eval"/);
  assert.match(control, /JSON\.stringify\(\{ agi_id: target\.agi_id, tool_key: target\.tool_key \}\)/);
  assert.doesNotMatch(control, /Promise\.all|Promise\.allSettled|run-all/);
  assert.match(control, /mfa_required/);
  assert.match(control, /\/auth\/mfa\?returnTo=%2Fagis/);
});

test("Owner can explicitly open the existing AAL2 step-up flow from certification UI", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /href="\/auth\/mfa\?returnTo=%2Fagis"/);
  assert.match(control, /Elevar sesión a AAL2/);
  assert.match(control, /Google Authenticator/);
  assert.match(control, /TOTP ya registrado/);
});

test("batch certification is explicit about bounded calls and partial evidence", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /16 AGIs/);
  assert.match(control, /48 llamadas/);
  assert.match(control, /toolEvalTargets\.length/);
  assert.match(control, /runtimeCompleted/);
  assert.match(control, /runtimePassed/);
  assert.match(control, /runtimeFailed/);
  assert.match(control, /toolCompleted/);
  assert.match(control, /toolPassed/);
  assert.match(control, /errors/);
  assert.match(control, /router\.refresh\(\)/);
});

test("batch certification fails closed when the server snapshot is partial", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(page, /certificationSource=\{certification\.source\}/);
  assert.match(control, /certificationSource: "supabase\+code" \| "partial"/);
  assert.match(control, /const snapshotPartial = certificationSource === "partial"/);
  assert.match(control, /disabled=\{busy \|\| invalidCatalog \|\| snapshotPartial \|\| nothingPending\}/);
  assert.match(control, /snapshot parcial/i);
});
