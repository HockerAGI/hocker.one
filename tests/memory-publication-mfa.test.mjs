import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("modern memory review decisions require Owner AAL2 for the target project", async () => {
  const route = await read("src/app/api/agi/runtime/memory/review/route.ts");

  assert.match(route, /requireOwnerAal2Api\(projectId\)/);
  assert.doesNotMatch(route, /requireProjectRole\(projectId, \["owner"\]\)/);
  assert.match(route, /"session_owner"/);
});

test("legacy memory publication cannot use the shared Owner key as a step-up substitute", async () => {
  const route = await read("src/app/api/agi/learning/review/route.ts");

  assert.match(route, /const publishToMemory = input\.publish_to_memory === true/);
  assert.match(route, /if \(publishToMemory\) \{/);
  assert.match(route, /requireOwnerAal2Api\(projectId\)/);
  assert.match(route, /effectiveActor = "session_owner"/);
  assert.match(route, /decideSyntiaMemoryReview\(input, effectiveActor, traceId\)/);
});

test("legacy non-publication reviews retain the existing service gate", async () => {
  const route = await read("src/app/api/agi/learning/review/route.ts");

  assert.match(route, /validateHockerOwnerApiGate\(req\)/);
  assert.match(route, /let effectiveActor = gate\.actor/);
});
