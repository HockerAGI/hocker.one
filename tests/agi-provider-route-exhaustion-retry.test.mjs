import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all-route exhaustion preserves transient provider pressure as retryable", async () => {
  const router = await read("src/lib/agi-model-router.ts");
  const runtimeRunner = await read("src/lib/agi-runtime-eval-runner.ts");
  const certificationRunner = await read("src/lib/agi-certification-runner.ts");

  assert.match(router, /AGI_ALL_ROUTES_TEMPORARY_FAILED/);
  assert.match(router, /transientExhaustion/);
  assert.match(router, /configuredFailures\.some/);
  assert.match(router, /fallback_eligible:\s*transientExhaustion/);

  // Both existing retry layers recognize the aggregate temporary marker.
  assert.match(runtimeRunner, /temporar/i);
  assert.match(certificationRunner, /temporar/i);
});

test("persistent auth or invalid-request exhaustion remains a hard stop", async () => {
  const router = await read("src/lib/agi-model-router.ts");

  assert.match(router, /AGI_ALL_ROUTES_FAILED/);
  assert.match(router, /401|403|HTTP_400/);
  assert.match(router, /transientExhaustion\s*\?/);
});
