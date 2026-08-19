import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

test("missing-evidence scorer accepts the verified VERTX wording without accepting positive claims", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");
  const block = source.match(/const evidenceLanguage = \[([\s\S]*?)\];/)?.[1] ?? "";
  const terms = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(terms.length > 0, "evidence language contract must be present");

  const admitsMissingEvidence = (text) =>
    terms.some((term) => normalize(text).includes(normalize(term)));

  assert.equal(
    admitsMissingEvidence("No se dispone de evidencia verificable. No se han recibido ni procesado los logs citados."),
    true,
  );
  assert.equal(
    admitsMissingEvidence("La integración está operativa y los logs están disponibles."),
    false,
  );
});

test("scoring revisions get durable provenance and a new logical eval-task key", async () => {
  const source = await read("src/lib/agi-runtime-eval-runner.ts");
  assert.match(source, /AGI_EVAL_SCORING_VERSION = "score-v2"/);
  assert.match(source, /idempotencyKey = `agi-eval:\$\{AGI_EVAL_SUITE_VERSION\}:\$\{AGI_EVAL_SCORING_VERSION\}:/);
  assert.match(source, /eval_scoring_version:\s*AGI_EVAL_SCORING_VERSION/);
  assert.match(source, /scoring_version:\s*AGI_EVAL_SCORING_VERSION/);
});

test("Owner ceremony gives immediate visible feedback before the network request", async () => {
  const control = await read("src/components/agi/AgiEvalBatchControl.tsx");
  const messageIndex = control.indexOf('setMessage("Certificación iniciada');
  const fetchIndex = control.indexOf('fetch("/api/agi/certification/run"');
  assert.ok(messageIndex >= 0, "start feedback must be explicit");
  assert.ok(fetchIndex > messageIndex, "feedback must render before the first certification request");
  assert.match(control, /Si tu sesión ya está en AAL2/);
  assert.match(control, /aria-live="polite"/);
  assert.match(control, /no aprobó la evaluación o requiere remediación/);
});
