import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("learning extractor only creates distilled candidates", async () => {
  const source = await read("src/lib/agi-learning-extractor.ts");
  assert.match(source, /export async function extractLearningCandidate/);
  assert.match(source, /submitSyntiaMemoryProposal/);
  assert.match(source, /learning_processed_at/);
  assert.match(source, /source_hash|source_refs/);
  assert.match(source, /confidence/);
  assert.doesNotMatch(source, /transcript\s*:/i);
  assert.doesNotMatch(source, /messages\s*:\s*\[/i);
});

test("sensitive or trivial chat is not promoted to shared memory", async () => {
  const source = await read("src/lib/agi-learning-extractor.ts");
  assert.match(source, /small[_ -]?talk|trivial/i);
  assert.match(source, /secret|sensitive|pii/i);
  assert.match(source, /return null/);
});
