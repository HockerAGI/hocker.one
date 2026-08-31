import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = async (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

// ... existing tests above this point ...

test("recovery card keeps current production and certification pointers explicit", async () => {
  const state = await source("docs/operations/LAST_KNOWN_STATE.md");
  assert.match(state, /REQUERY MUTABLE FACTS BEFORE ACTION/);
  assert.match(state, /HANDOFF_2026-08-30\.md/);
  assert.match(state, /## Current verified pointers/);
  assert.match(state, /Core AGI certification:.*2026\.08\.21-8.*score-v5/i);
  assert.match(state, /allow_actions=false/);
  assert.match(state, /Supabase project `yvuibbcuntqpyqiuqggd`/);
  assert.match(state, /## Expansion status/);
  assert.match(state, /EXPANSION_READY = YES/);
  assert.match(state, /PRODUCTION_READY = NOT YET CLOSED/);
  assert.match(state, /Historical sources dated 2026-08-19 remain preserved/i);
  assert.doesNotMatch(state, /32244656734|TS18047|progress possibly null/i);
  assert.doesNotMatch(state, /f122b15c8136c8885edfd24396115c6bda1b6329/);
  assert.doesNotMatch(state, /dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf/);
  assert.doesNotMatch(state, /9dfdc688f73f6cad69c40179c1bb3a0a831bbb45/);
});
