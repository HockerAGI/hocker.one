import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("owner/internal API authentication never accepts command signing secrets", async () => {
  const source = await read("src/lib/hocker-owner-api-gate.ts");

  assert.doesNotMatch(source, /process\.env\.HOCKER_COMMAND_HMAC_SECRET/);
  assert.doesNotMatch(source, /process\.env\.COMMAND_HMAC_SECRET/);
  assert.match(source, /process\.env\.HOCKER_ONE_INTERNAL_TOKEN/);
  assert.match(source, /process\.env\.NOVA_ORCHESTRATOR_KEY/);
});
