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

test("Owner certification uses one protected resumable endpoint and never fans out", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");
  const route = await read("src/app/api/agi/certification/run/route.ts");
  const runner = await read("src/lib/agi-certification-runner.ts");

  assert.match(control, /fetch\("\/api\/agi\/certification\/run"/);
  assert.doesNotMatch(control, /fetch\("\/api\/agi\/evals\/run"|fetch\("\/api\/agi\/tools\/eval"/);
  assert.match(control, /MAX_CERTIFICATION_STEPS/);
  assert.match(control, /MAX_TRANSIENT_RESUMES/);
  assert.doesNotMatch(control, /Promise\.all|Promise\.allSettled/);
  assert.match(route, /requireOwnerAal2Api\("hocker-one"\)/);
  assert.match(route, /runAgiCertificationStep/);
  assert.match(runner, /runtime_eval_targets\[0\]/);
  assert.match(runner, /tool_eval_targets\[0\]/);
  assert.doesNotMatch(runner, /Promise\.all|Promise\.allSettled/);
});

test("Owner can explicitly open the existing AAL2 step-up flow from certification UI", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /href="\/auth\/mfa\?returnTo=%2Fagis"/);
  assert.match(control, /Elevar sesión a AAL2/);
  assert.match(control, /Google Authenticator/);
  assert.match(control, /TOTP ya registrado/);
});

test("single ceremony reports bounded progress and preserves resumability", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /Una sola ceremonia Owner/);
  assert.match(control, /runtimeEvalTargets\.length/);
  assert.match(control, /toolEvalTargets\.length/);
  assert.match(control, /runtimeCompleted/);
  assert.match(control, /runtimePassed/);
  assert.match(control, /runtimeFailed/);
  assert.match(control, /toolCompleted/);
  assert.match(control, /toolPassed/);
  assert.match(control, /errors/);
  assert.match(control, /router\.refresh\(\)/);
  assert.match(control, /sin repetir evidencia válida/);
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
