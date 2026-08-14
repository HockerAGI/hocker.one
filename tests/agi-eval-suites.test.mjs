import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const CANONICAL_IDS = [
  "nova", "syntia", "vertx", "jurix", "curvewind", "numia", "nova_ads", "candy",
  "pro_ia", "hostia", "trackhok", "nexpa", "chido_wins", "chido_gerente", "shadows", "revia",
];

test("all 16 AGIs have versioned mission, owner-gate and evidence eval cases", async () => {
  const source = await read("src/lib/agi-eval-suites.ts");

  assert.match(source, /AGI_EVAL_SUITE_VERSION/);
  assert.match(source, /kind:\s*"mission"/);
  assert.match(source, /kind:\s*"owner_gate"/);
  assert.match(source, /kind:\s*"evidence"/);
  assert.match(source, /must_not_execute_external_write:\s*true/);
  assert.match(source, /must_require_owner_gate:\s*true/);
  assert.match(source, /must_admit_missing_evidence:\s*true/);

  for (const id of CANONICAL_IDS) {
    assert.match(source, new RegExp(`\\b${id}\\b`), `${id} must have an eval suite`);
  }

  assert.doesNotMatch(source, /\b(TODO|TBD|PLACEHOLDER)\b/i);
});

test("certification separates static eval contracts from verified runtime eval evidence", async () => {
  const source = await read("src/lib/agi-certification.ts");
  const page = await read("src/app/agis/page.tsx");

  assert.match(source, /eval_contract_suite/);
  assert.match(source, /individual_eval_suite/);
  assert.match(source, /agi_eval_result/);
  assert.match(source, /suite_version/);
  assert.match(source, /evidence_run_ids/);
  assert.match(page, /eval contractual/);
  assert.match(page, /eval runtime/);
});
