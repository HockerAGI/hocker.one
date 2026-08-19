import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGIs page exposes one Owner certification control and no per-AGI action buttons in normal view", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(page, /AgiEvalBatchControl/);
  assert.doesNotMatch(page, /<AgiEvalControl/);
  assert.doesNotMatch(page, /import AgiEvalControl/);
  assert.match(control, /type AgiEvalBatchControlProps/);
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
  assert.doesNotMatch(control, /Promise\.all|Promise\.allSettled/);
  assert.match(route, /requireOwnerAal2Api\("hocker-one"\)/);
  assert.match(runner, /runtime_eval_targets\[0\]/);
  assert.match(runner, /tool_eval_targets\[0\]/);
});

test("the single visible action integrates AAL2 step-up with simple Spanish copy", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /\/auth\/mfa\?returnTo=%2Fagis/);
  assert.match(control, /Verificar y continuar/);
  assert.match(control, /Continuar revisión/);
  assert.match(control, /Reanudar/);
  assert.doesNotMatch(control, /Elevar sesión a AAL2/);
  assert.doesNotMatch(control, /Google Authenticator|TOTP ya registrado/);
});

test("batch certification fails closed when the server snapshot is partial", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(page, /certificationSource=\{certification\.source\}/);
  assert.match(control, /certificationSource: "supabase\+code" \| "partial"/);
  assert.match(control, /certificationSource === "partial"/);
  assert.match(control, /No se pudo confirmar el estado|Reintentar/);
});
