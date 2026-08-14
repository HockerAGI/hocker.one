import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const CANONICAL_IDS = [
  "nova", "syntia", "vertx", "jurix", "curvewind", "numia", "nova_ads", "candy",
  "pro_ia", "hostia", "trackhok", "nexpa", "chido_wins", "chido_gerente", "shadows", "revia",
];

test("AGI certification matrix is evidence-based and covers all 16 canonical identities", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /AGI_CERTIFICATION_VERSION/);
  assert.match(source, /individual_eval_suite/);
  assert.match(source, /allow_actions_guarded/);
  assert.match(source, /memory_ready/);
  assert.match(source, /tools_ready/);
  assert.match(source, /runtime_evidence/);
  assert.match(source, /missing:/);

  for (const id of CANONICAL_IDS) {
    assert.match(source, new RegExp(`\\b${id}\\b`), `${id} must be represented by the certification matrix`);
  }
});

test("certification uses the production operational view contract and Memory Mirror for memory evidence", async () => {
  const source = await read("src/lib/agi-certification.ts");

  assert.match(source, /type OperationalRow = \{ agi_id: string; tasks: number \| null; runs: number \| null \}/);
  assert.match(source, /select\("agi_id,tasks,runs"\)/);
  assert.match(source, /Number\(operational\?\.tasks \?\? 0\) > 0/);
  assert.match(source, /Number\(operational\?\.runs \?\? 0\) > 0/);
  assert.doesNotMatch(source, /task_count|run_count/);
  assert.doesNotMatch(source, /agi_update_feed/);
});

test("AGIs page surfaces certification without creating duplicate navigation", async () => {
  const page = await read("src/app/agis/page.tsx");
  assert.match(page, /getAgiCertificationSnapshot/);
  assert.match(page, /Certificaci[oó]n/);
  assert.match(page, /Pendiente/);
  assert.doesNotMatch(page, /href=\"\/agi-certification\"/);
});

test("Hocker Ads is no longer reported as an application that does not exist", async () => {
  const operational = await read("src/lib/hocker-operational-state.ts");
  assert.doesNotMatch(operational, /\["hocker-ads",\s*"Hocker Ads",\s*"Aplicaci[oó]n de publicidad a[uú]n no creada\."\]/);
  assert.match(operational, /key:\s*"hocker-ads"[\s\S]*?status:\s*"configured"/);
  assert.match(operational, /repository:\s*"HockerAGI\/hocker\.ads"/);
  assert.match(operational, /sin deployment productivo verificado/i);
});
