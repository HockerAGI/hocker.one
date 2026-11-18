import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

async function classifier() {
  const src = await read("src/lib/agi-engineering-integration-readiness.ts");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, { module: mod, exports: mod.exports });
  return mod.exports.summarizeEngineeringReadiness;
}

async function readinessSelector() {
  const src = await read("src/lib/agi-engineering-integration-readiness.ts");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, { module: mod, exports: mod.exports });
  return mod.exports.selectGitHubReadinessProbeRepositories;
}

test("Owner connection probe accepts only authorized repository intersection, never an empty scope", async () => {
  const select = await readinessSelector();
  assert.deepEqual(Array.from(select(["hocker.one"])), ["HockerAGI/hocker.one"]);
  assert.deepEqual(Array.from(select(["NOVA.AGI", "unrelated-repo"])), ["HockerAGI/nova.agi"]);
  assert.deepEqual(Array.from(select(["hocker-node-agent", "hocker.one"])),
    ["HockerAGI/hocker.one", "HockerAGI/hocker-node-agent"]);
  assert.deepEqual(Array.from(select(["hocker.one", "nova.agi", "hocker-node-agent"])),
    ["HockerAGI/hocker.one", "HockerAGI/nova.agi", "HockerAGI/hocker-node-agent"]);
  assert.deepEqual(Array.from(select(["unrelated-private-repo"])), []);
  assert.deepEqual(Array.from(select([])), []);
});

test("absent Production identities block new/existing app engineering preparation without requiring hardware", async () => {
  const summarize = await classifier();
  const actual = summarize({
    github_configured: false, github_verified_read: false,
    vercel_configured: false, vercel_verified_read: false,
  });
  assert.equal(actual.github.state, "missing");
  assert.equal(actual.vercel.state, "missing");
  assert.equal(actual.can_prepare_existing_app_proposal, false);
  assert.equal(actual.can_prepare_new_app_bootstrap, false);
  assert.equal(actual.owner_gate_required_for_writes, true);
  assert.equal(actual.github_write_scope_verified, false);
  assert.equal(actual.node_agent_required, false);
  assert.deepEqual(Array.from(actual.blockers), [
    "GITHUB_RUNTIME_IDENTITY_MISSING", "VERCEL_RUNTIME_IDENTITY_MISSING",
  ]);
});

test("presence alone is not an authenticated read or a write-scope attestation", async () => {
  const summarize = await classifier();
  const actual = summarize({
    github_configured: true, github_verified_read: false,
    vercel_configured: true, vercel_verified_read: false,
  });
  assert.equal(actual.github.state, "verification_failed");
  assert.equal(actual.vercel.state, "verification_failed");
  assert.equal(actual.can_prepare_new_app_bootstrap, false);
  assert.equal(actual.github_write_scope_verified, false);
});

test("verified GitHub read enables proposal preparation, not unchecked Vercel bootstrap", async () => {
  const summarize = await classifier();
  const actual = summarize({
    github_configured: true, github_verified_read: true,
    vercel_configured: false, vercel_verified_read: false,
  });
  assert.equal(actual.github.state, "verified_read");
  assert.equal(actual.can_prepare_existing_app_proposal, true);
  assert.equal(actual.can_prepare_new_app_bootstrap, false);
  assert.equal(actual.owner_gate_required_for_writes, true);
});

test("both read probes do not grant permissions to write", async () => {
  const summarize = await classifier();
  const actual = summarize({
    github_configured: true, github_verified_read: true,
    vercel_configured: true, vercel_verified_read: true,
  });
  assert.equal(actual.can_prepare_existing_app_proposal, true);
  assert.equal(actual.can_prepare_new_app_bootstrap, true);
  assert.equal(actual.github_write_scope_verified, false);
  assert.equal(actual.owner_gate_required_for_writes, true);
  assert.equal(actual.node_agent_required, false);
  assert.equal(actual.blockers.length, 0);
});

test("AAL2 Owner Gate must precede any real provider read and never exposes secrets", async () => {
  const route = await read("src/app/api/agi/runtime/integrations/readiness/route.ts");
  const gate = route.indexOf("await requireOwnerAal2Api(PROJECT_ID)");
  const githubProbe = route.indexOf('executeGitHubReadOperation("get_repo"');
  const vercelProbe = route.indexOf("getVercelProject({ project_id: vercelProjectId })");
  assert.ok(gate >= 0 && githubProbe > gate && vercelProbe > gate);
  assert.match(route, /hasGitHubRuntimeToken\(\)/);
  assert.match(route, /process\.env\.VERCEL_ENV/);
  assert.match(route, /const productionScope = checkedEnvironment === "production"/);
  assert.match(route, /githubConfigured = productionScope && hasGitHubRuntimeToken\(\)/);
  assert.match(route, /vercelConfigured = productionScope && hasVercelRuntimeToken\(\)/);
  assert.match(route, /production_scope_verified: productionScope/);
  assert.match(route, /NON_PRODUCTION_SCOPE_NOT_CERTIFIED/);
  assert.match(route, /getGitHubRuntimeReadProbeRepositoryNames\(\)/);
  assert.match(route, /selectGitHubReadinessProbeRepositories\(/);
  assert.match(route, /githubConfigured && githubProbeRepositories\.length > 0/);
  assert.match(route, /github_read_probe_repositories: githubProbeRepositories/);
  assert.match(route, /results\.every\(Boolean\)/);

  assert.match(route, /hasVercelRuntimeToken\(\)/);
  assert.match(route, /project\.id === vercelProjectId/);
  assert.match(route, /vercelConfigured && vercelProjectId/);
  assert.match(route, /Cache-Control": "no-store/);
  assert.match(route, /authentication_scope: "read_only_verified_no_write_attestation"/);
  assert.doesNotMatch(route, /getGitHubRuntimeToken|getVercelRuntimeToken/);
  assert.doesNotMatch(route, /POST|PUT|PATCH|DELETE|enqueueAgiAction/);
  const ui = await read("src/components/owner/OwnerApprovalCenter.tsx");
  assert.match(ui, /\/api\/agi\/runtime\/integrations\/readiness/);
  assert.match(ui, /setIntegrations\(null\)/);
  assert.match(ui, /Node Agent físico/);
  assert.match(ui, /Entorno comprobado/);
  assert.match(ui, /!integrations\.production_scope_verified/);
  assert.match(ui, /NO acredita Production/);
  assert.doesNotMatch(ui, /type=["']password["']/);
});


test("GitHub App read access never implies organization repository-creation capability", async () => {
  const summarize = await classifier();
  const status = summarize({
    github_configured: true,
    github_verified_read: true,
    github_repo_creation_identity_configured: false,
    vercel_configured: true,
    vercel_verified_read: true,
  });
  assert.equal(status.github.state, "verified_read");
  assert.equal(status.can_prepare_existing_app_proposal, true);
  assert.equal(status.can_prepare_new_app_bootstrap, false);
  assert.equal(status.github_repo_creation_identity_configured, false);
  assert.equal(status.owner_gate_required_for_writes, true);
  assert.equal(status.github_write_scope_verified, false);
  assert.ok(Array.from(status.blockers).includes("GITHUB_REPO_CREATION_IDENTITY_NOT_CONFIGURED"));
});
