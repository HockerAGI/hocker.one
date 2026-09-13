import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operating loop defines one governed work-session state machine", async () => {
  const [types, state] = await Promise.all([
    read("src/lib/hocker-operating-loop/types.ts"),
    read("src/lib/hocker-operating-loop/state.ts"),
  ]);
  for (const value of ["planning", "researching", "ready", "awaiting_owner", "approved", "executing", "verifying", "completed", "blocked", "failed", "canceled"]) {
    assert.match(types, new RegExp(`\\"${value}\\"`));
  }
  assert.match(state, /INVALID_WORK_SESSION_TRANSITION/);
  assert.match(state, /executing: \["verifying", "failed", "blocked"\]/);
});

test("candidate and approval contracts bind execution state without creating another authority", async () => {
  const types = await read("src/lib/hocker-operating-loop/types.ts");
  assert.match(types, /candidate_hash/);
  assert.match(types, /repository_sha/);
  assert.match(types, /migration_head/);
  assert.match(types, /runtime_revision/);
  assert.match(types, /execution_scope/);
  assert.match(types, /aal2_evidence_id/);
  assert.match(types, /expires_at/);
  assert.match(types, /risk: z\.enum\(\["R0", "R1", "R2", "R3", "R4"\]\)/);
  assert.doesNotMatch(types, /queue_id/);
  assert.doesNotMatch(types, /memory_store_id/);
  assert.doesNotMatch(types, /registry_id/);
});

test("research records require current-source provenance", async () => {
  const types = await read("src/lib/hocker-operating-loop/types.ts");
  assert.match(types, /source_id/);
  assert.match(types, /url: z\.string\(\)\.url\(\)/);
  assert.match(types, /publisher/);
  assert.match(types, /consulted_at: z\.string\(\)\.datetime\(\)/);
  assert.match(types, /scope/);
  assert.match(types, /relevance/);
  assert.match(types, /impact/);
});

test("candidate hashing is deterministic and provider-neutral", async () => {
  const hash = await read("src/lib/hocker-operating-loop/hash.ts");
  assert.match(hash, /Object\.entries\(value as Record<string, unknown>\)\s*\.sort/);
  assert.match(hash, /SHA-256/);
  assert.match(hash, /crypto\.subtle\.digest/);
});
