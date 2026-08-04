import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const CANONICAL_IDS = [
  "nova",
  "syntia",
  "vertx",
  "jurix",
  "curvewind",
  "numia",
  "nova_ads",
  "candy",
  "pro_ia",
  "hostia",
  "trackhok",
  "nexpa",
  "chido_wins",
  "chido_gerente",
  "shadows",
  "revia",
];

test("canon contains exactly the 16 approved AGI identities", async () => {
  const source = await read("src/lib/hocker-agi-canon.ts");
  const ids = [...source.matchAll(/\n\s{4}"id": "([a-z_]+)"/g)].map((match) => match[1]);

  assert.deepEqual(ids, CANONICAL_IDS);
  assert.match(source, /HOCKER_AGI_CANON_VERSION = "12\.6C\.1B"/);
  assert.match(source, /Arquitecto de Ingresos y motor comercial autónomo supervisado/);
});

test("operational layer owns aliases, full routing and Shadows fail-closed", async () => {
  const source = await read("src/lib/hocker-agi-operational.ts");

  for (const id of CANONICAL_IDS) {
    assert.match(source, new RegExp(`\\b${id}: \\[|profile: "${id}"|"${id}"`));
  }

  for (const profile of [
    "curvewind",
    "candy",
    "pro_ia",
    "trackhok",
    "nexpa",
    "chido_wins",
    "chido_gerente",
  ]) {
    assert.match(source, new RegExp(`profile: "${profile}"`));
  }

  assert.match(source, /return canonicalAgiId\(value\) !== "shadows"/);
  assert.match(source, /if \(id === "shadows"\) return "planned"/);
  assert.match(source, /canon_version: HOCKER_AGI_CANON_VERSION/);
});

test("runtime catalog uses canon and never enables code-only tools", async () => {
  const source = await read("src/lib/agi-runtime-core.ts");

  assert.match(source, /HOCKER_AGI_CANON/);
  assert.match(source, /canonicalAgentRows/);
  assert.match(source, /canonicalAgiMeta/);
  assert.match(source, /implementation_status === "code_only"/);
  assert.match(source, /status = "missing_code"/);
  assert.match(source, /tool\?\.execution_enabled && !planned/);
  assert.match(source, /SHADOWS_ACTION_BLOCKED_UNTIL_EPHEMERAL_SANDBOX/);
  assert.doesNotMatch(source, /import \{ AGI_REGISTRY \} from "@\/lib\/hocker-dashboard"/);
  assert.doesNotMatch(source, /capabilities: \[agi\.category \?\? "ecosystem"\]/);
});

test("serverless worker executes canonical prompts and complete routing", async () => {
  const source = await read("src/lib/serverless-agi-runtime.ts");

  assert.match(source, /buildCanonicalProfilePrompt/);
  assert.match(source, /routeChatProfile/);
  assert.match(source, /canon_version: HOCKER_AGI_CANON_VERSION/);
  assert.match(source, /AGI_PROFILE_NOT_OPERATIONAL/);
  assert.match(source, /status === "planned"/);
  assert.match(source, /kind: "verified_model_completion"/);
  assert.doesNotMatch(source, /const CHAT_PROFILE_RULES/);
  assert.doesNotMatch(source, /const functions = stringList\(meta\.functions\)/);
});
