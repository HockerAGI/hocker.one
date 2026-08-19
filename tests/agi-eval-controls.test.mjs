import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGIs page exposes one unified certification control instead of per-AGI manual buttons", async () => {
  const page = await read("src/app/agis/page.tsx");
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(page, /AgiEvalBatchControl/);
  assert.doesNotMatch(page, /AgiEvalControl/);
  assert.match(control, /fetch\("\/api\/agi\/certification\/run"/);
  assert.doesNotMatch(control, /\/api\/agi\/evals\/run/);
  assert.doesNotMatch(control, /JSON\.stringify\(\{\s*agi_id/);
});

test("unified certification control handles MFA step-up and preserves resumable progress", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /mfa_required/);
  assert.match(control, /\/auth\/mfa\?returnTo=%2Fagis/);
  assert.match(control, /Verificar y continuar/);
  assert.match(control, /Reanudar/);
  assert.match(control, /Reintentar/);
  assert.match(control, /Lo ya realizado se conserva/);
  assert.match(control, /router\.refresh\(\)/);
});

test("unified certification control is bounded and fail-closed", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");

  assert.match(control, /MAX_CERTIFICATION_STEPS = 64/);
  assert.match(control, /MAX_TRANSIENT_RESUMES = 2/);
  assert.match(control, /snapshotPartial/);
  assert.match(control, /invalidCatalog/);
  assert.match(control, /nothingPending/);
  assert.match(control, /No se pudo confirmar el estado\. No se ejecutará ninguna prueba\./);
  assert.match(control, /disabled=\{processing === action\.id\}|busy \|\| snapshotPartial \|\| invalidCatalog \|\| nothingPending/);
});
