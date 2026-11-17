import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

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

test("Node Agent status rejects HTTP health pages, 401/404 and stale heartbeat", async () => {
  const source = await read("src/app/api/system/status/route.ts");
  const start = source.indexOf("function nodeReadyUrl(");
  const end = source.indexOf("async function checkAgentByUrl(", start);
  assert.ok(start >= 0 && end > start);
  const compiled = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const evaluate = async (status, payload, url = "https://node.example/health") => {
    const moduleForTest = { exports: {} };
    vm.runInNewContext(compiled + "\nmodule.exports = {nodeReadyUrl, probeNodeReady};", {
      module: moduleForTest,
      exports: moduleForTest.exports,
      URL,
      AbortController,
      setTimeout,
      clearTimeout,
      fetch: async () => ({ status, json: async () => payload }),
    });
    const { nodeReadyUrl, probeNodeReady } = moduleForTest.exports;
    return {
      normalizedUrl: nodeReadyUrl(url),
      ready: await probeNodeReady(nodeReadyUrl(url)),
    };
  };

  for (const httpStatus of [200, 401, 403, 404, 500]) {
    const result = await evaluate(httpStatus, { ok: true, service: "hocker-node-agent" });
    assert.equal(result.ready, false, "health-only or HTTP error is never readiness");
  }
  const authentic = { ok: true, status: "ready", heartbeat_fresh: true };
  assert.equal((await evaluate(200, authentic)).ready, true);
  assert.equal((await evaluate(200, { ...authentic, heartbeat_fresh: false })).ready, false);
  assert.equal((await evaluate(503, authentic)).ready, false);
  assert.equal((await evaluate(200, authentic, "https://node.example/ready?debug=1")).normalizedUrl,
    "https://node.example/ready");
  assert.equal((await evaluate(200, authentic, "ftp://node.example/ready")).ready, false);

  const direct = source.slice(source.indexOf("async function checkAgentByUrl("),
    source.indexOf("async function checkAgentBySupabase("));
  assert.match(direct, /probeNodeReady\(nodeReadyUrl\(configured\)\)/);
  assert.match(direct, /await checkAgentBySupabase\(\)/);
  assert.doesNotMatch(direct, /await probe\(/);
  assert.match(direct, /Sin endpoint \/ready configurado/);
  assert.doesNotMatch(source, /return checkAgentBySupabase\(\)/);
  const missingUrlModule = { exports: {} };
  const isolatedCheck = ts.transpileModule(direct, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(isolatedCheck + "\nmodule.exports.check = checkAgentByUrl;", {
    module: missingUrlModule, exports: missingUrlModule.exports,
    env: () => "", nodeReadyUrl: () => "",
    probeNodeReady: async () => true,
    checkAgentBySupabase: async () => ({ active: true, label: "Agente", detail: "Online" }),
  });
  const withoutUrl = await missingUrlModule.exports.check();
  assert.equal(withoutUrl.active, false, "fresh Supabase heartbeat without /ready must fail closed");
  assert.match(source, /secondsSince\(node\.last_seen_at\)/);
  assert.doesNotMatch(source, /secondsSince\(node\.last_seen_at \|\| node\.updated_at\)/);
  assert.match(source, /const online = node\.status === "online"/);
});
