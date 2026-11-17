import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

async function coreClassifier() {
  const source = await read("src/lib/hocker-health-boundaries.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, { module: mod, exports: mod.exports });
  return mod.exports.evaluateServerlessCoreHealth;
}

const healthyCore = () => ({
  web: { active: true, required: true, label: "Web" },
  vercel: { active: true, required: true, label: "Vercel" },
  supabase: { active: true, required: true, label: "Supabase" },
  api: { active: true, required: true, label: "API" },
  nova: { active: false, required: false, label: "NOVA dedicada" },
  agent: { active: false, required: false, label: "Node Agent físico" },
});

test("node-free serverless core reports healthy while dedicated NOVA and physical node remain unverified", async () => {
  const calculate = await coreClassifier();
  const actual = calculate(healthyCore());
  assert.equal(actual.overall, "healthy");
  assert.equal(actual.coreActive, 4);
  assert.equal(actual.coreTotal, 4);
  assert.equal(actual.optionalUnavailable, 2);
});

test("actual core outage remains down even when optional services are online", async () => {
  const calculate = await coreClassifier();
  const checks = healthyCore();
  checks.supabase.active = false;
  checks.nova.active = true;
  checks.agent.active = true;
  const actual = calculate(checks);
  assert.equal(actual.overall, "down");
  assert.equal(actual.coreActive, 3);
  assert.equal(actual.optionalUnavailable, 0);
});

test("missing and unclassified core evidence never becomes healthy", async () => {
  const calculate = await coreClassifier();
  assert.equal(calculate(null).overall, "unknown");
  assert.equal(calculate({}).overall, "unknown");
  const missingApi = healthyCore();
  delete missingApi.api;
  assert.equal(calculate(missingApi).overall, "unknown");
  const legacy = healthyCore();
  delete legacy.web.required;
  assert.equal(calculate(legacy).overall, "unknown");
  const invalid = healthyCore();
  invalid.vercel.active = "yes";
  assert.equal(calculate(invalid).overall, "unknown");
});

test("new required services are not silently excluded from core outages", async () => {
  const calculate = await coreClassifier();
  const checks = healthyCore();
  checks.scheduler = { active: false, required: true, label: "Scheduler" };
  assert.equal(calculate(checks).overall, "down");
});

test("private system status distinguishes the cloud core from the optional physical node", async () => {
  const route = await read("src/app/api/system/status/route.ts");
  const indicator = await read("src/components/HealthIndicator.tsx");
  const legacyHealth = await read("src/app/api/health/route.ts");
  assert.match(route, /health_scope: "hocker_one_serverless_core"/);
  for (const key of ["web", "vercel", "supabase", "api"]) {
    assert.match(route, new RegExp(key + ":[^;]*required: true", "s"));
  }
  assert.match(route, /nova: \{ \.\.\.nova, label: "NOVA dedicada", required: false \}/);
  assert.match(route, /agent: \{ \.\.\.agent, label: "Node Agent físico", required: false \}/);
  assert.match(route, /return res\.ok;/);
  assert.match(indicator, /evaluateServerlessCoreHealth\(rawChecks\)/);
  assert.doesNotMatch(indicator, /c\.label === "Supabase" \|\| c\.label === "NOVA"/);
  assert.match(legacyHealth, /checks\.db && checks\.supabaseUrl && checks\.supabaseAnon/);
  assert.match(legacyHealth, /payload\.status === "online" \? 200 : 503/);
  assert.match(legacyHealth, /readiness_scope: "serverless_control_plane"/);
});
