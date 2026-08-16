import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGI inference context is reconstructed from durable HOCKER state", async () => {
  const source = await read("src/lib/agi-context-builder.ts");
  assert.match(source, /export async function buildAgiInferenceContext/);
  assert.match(source, /buildCanonicalProfilePrompt/);
  assert.match(source, /loadAgiConversationContext/);
  assert.match(source, /agi_memory_mirror/);
  assert.match(source, /operational_context/);
  assert.match(source, /context_budget/);
});

test("context authority keeps canon before mutable memories and provider metadata out of identity", async () => {
  const source = await read("src/lib/agi-context-builder.ts");
  const canon = source.indexOf("canonical_profile");
  const history = source.indexOf("recent_messages");
  const summary = source.indexOf("durable_summary");
  const memory = source.indexOf("memory_items");
  assert.ok(canon >= 0 && history > canon && summary > canon && memory > canon);
  assert.doesNotMatch(source, /provider.*identity|model.*identity/i);
});
