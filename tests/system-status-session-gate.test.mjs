import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("system status is a private R0 read authorized by session or internal service identity", async () => {
  const [gate, route] = await Promise.all([
    read("src/lib/private-session-api-gate.ts"),
    read("src/app/api/system/status/route.ts"),
  ]);

  assert.match(gate, /validateHockerOwnerApiGate\(request\)/);
  assert.match(gate, /legacyGate\.ok && legacyGate\.actor === "internal"/);
  assert.match(gate, /auth\.getUser\(\)/);
  assert.match(gate, /from\("project_members"\)/);
  assert.match(gate, /new Set\(\["owner", "admin", "operator"\]\)/);
  assert.match(gate, /private_session_required/);
  assert.match(gate, /private_role_required/);
  assert.doesNotMatch(gate, /getAuthenticatorAssuranceLevel|aal2/i);

  assert.match(route, /requirePrivateReadApi\(request\)/);
  assert.doesNotMatch(route, /requireOwnerOrInternal/);
  assert.match(route, /authentication: privateAccess\.authentication/);
});

test("browser health indicator never reads or sends a shared Owner key", async () => {
  const indicator = await read("src/components/HealthIndicator.tsx");

  assert.match(indicator, /fetch\("\/api\/system\/status"/);
  assert.doesNotMatch(indicator, /__HOCKER_OWNER_KEY/);
  assert.doesNotMatch(indicator, /x-hocker-owner-key/i);
  assert.doesNotMatch(indicator, /authorization\s*:/i);
});

test("private status gate does not accept the shared Owner key as a service identity", async () => {
  const gate = await read("src/lib/private-session-api-gate.ts");

  assert.match(gate, /legacyGate\.actor === "internal"/);
  assert.doesNotMatch(gate, /legacyGate\.actor === "owner"/);
});

test("default browser CORS does not allow shared secret gate headers", async () => {
  const cors = await read("src/lib/cors.ts");

  assert.match(cors, /const DEFAULT_HEADERS = \["Content-Type", "Authorization", "apikey"\]/);
  assert.doesNotMatch(cors, /DEFAULT_HEADERS[^\n]*Hocker-Owner-Key/i);
  assert.doesNotMatch(cors, /DEFAULT_HEADERS[^\n]*Hocker-Internal-Key/i);
});

test("NOVA status requires dedicated runtime readiness evidence, never a generic HTTP response", async () => {
  const route = await read("src/app/api/system/status/route.ts");
  const nova = route.slice(route.indexOf("function novaReadyUrl("), route.indexOf("async function checkAgentByUrl("));
  assert.match(nova, /url\.pathname = url\.pathname/);
  assert.match(nova, /"\/health\/ready"/);
  assert.match(nova, /response\.status !== 200/);
  assert.match(nova, /data\.ok !== true/);
  assert.match(nova, /data\.status !== "ready"/);
  assert.match(nova, /data\.service !== "nova\.agi"/);
  for (const requirement of ["database", "inference_configuration", "worker", "heartbeat"]) {
    assert.ok(nova.includes(`hasPassed("${requirement}")`));
  }
  assert.match(nova, /Readiness no verificada/);
  assert.doesNotMatch(nova, /await probe\(\`\$\{base\}/);
  assert.doesNotMatch(nova, /return res\.status > 0 && res\.status < 500/);
});
