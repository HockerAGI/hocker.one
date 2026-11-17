import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Vercel is a real governed executor, not a fake AI Gateway label", async () => {
  const runtime = await read("src/lib/agi-runtime-core.ts");
  const executor = await read("src/lib/vercel-runtime-executor.ts");
  const route = await read("src/app/api/agi/runtime/vercel/route.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const worker = await read("src/lib/agi-action-execution.ts");

  assert.match(runtime, /tool_key: "vercel"/);
  assert.match(runtime, /implementation_status: "executor_ready"/);
  assert.match(executor, /buildPath\("\/v11\/projects", teamId\),\s*token,\s*"POST"/);
  assert.match(executor, /VERCEL_TOKEN/);
  assert.match(route, /"create_project"/);
  assert.match(route, /enqueueAgiAction/);
  assert.match(worker, /pending\.tool_key === "vercel"/);
  assert.match(worker, /depends_on_action_id/);
});

test("new repositories are private by default and restricted to HockerAGI", async () => {
  const executor = await read("src/lib/github-runtime-executor.ts");
  const worker = await read("src/lib/agi-action-execution.ts");
  const route = await read("src/app/api/agi/runtime/github/route.ts");

  assert.match(executor, /create_repository/);
  assert.match(executor, /ensureHockerOrganization/);
  assert.match(worker, /visibility: stringValue\(payload\.visibility, "private"\) as "private" \| "internal" \| "public"/);
  assert.match(worker, /payload\.private !== false/);
  assert.match(executor, /if \(owner !== allowedOwner\)/);
  assert.match(executor, /ensureHockerOrganization\(owner\)/);
  assert.match(route, /"create_repository"/);
  assert.match(route, /private: z\.boolean\(\)\.default\(true\)/);
});

test("application delivery remains queued and Owner-Gated", async () => {
  const materializer = await read("src/lib/nova-application-delivery-materializer.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const chat = await read("src/app/api/nova/chat/route.ts");

  assert.match(materializer, /github\.create_repository/);
  assert.match(materializer, /vercel\.create_project/);
  assert.match(materializer, /depends_on_action_id/);
  assert.match(materializer, /requires_approval: true/);
  assert.match(materializer, /executed: false/);
  assert.match(router, /assertMcpDependencyComplete/);
  assert.match(router, /executeApprovedMcpAction/);
  assert.match(chat, /materializeNovaApplicationDeliveryFromChat/);
});

test("application delivery never stores provider secret values in the queue", async () => {
  const materializer = await read("src/lib/nova-application-delivery-materializer.ts");
  const route = await read("src/app/api/agi/runtime/vercel/route.ts");

  assert.doesNotMatch(materializer, /VERCEL_TOKEN.*payload/);
  assert.doesNotMatch(materializer, /token.*payload/i);
  assert.match(route, /no_secret_values: true/);
});


test("Chido-sensitive requests cannot be reclassified as application delivery", async () => {
  const source = await read("src/lib/nova-chat-action-drafts.ts");
  const chidoIndex = source.indexOf('if (hasAny(message, [/chido/i');
  const appIndex = source.indexOf('return "application_delivery";');
  assert.ok(chidoIndex >= 0);
  assert.ok(appIndex > chidoIndex);
});

test("existing apps use NOVA inspection plus SHA-guarded GitHub mutations", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  const policy = await read("src/lib/mcp/mcp-policy.ts");
  const drafts = await read("src/lib/nova-chat-action-drafts.ts");
  const capabilities = await read("src/lib/hocker-capabilities-contract.ts");

  assert.match(route, /draftPreview\.scope === "application_delivery"/);
  assert.match(route, /read-only inspection can happen before any mutation is proposed/i);
  assert.doesNotMatch(route, /materializeNovaGitHubActionsFromChat/);
  assert.match(policy, /isAllowedGithubRepository/);
  assert.match(policy, /update_file.*create_or_update_file/);
  assert.match(policy, /expectedSha/);
  assert.match(drafts, /Leer el repositorio real/);
  assert.match(drafts, /obtener SHA de los archivos afectados/);
  assert.match(capabilities, /Crear, desarrollar y mantener apps \/ proyectos/);
});

test("GitHub MCP lifecycle mutations are dependency-ordered", async () => {
  const materializer = await read("src/lib/nova-mcp-action-materializer.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const policy = await read("src/lib/mcp/mcp-policy.ts");

  assert.match(materializer, /previousGithubLifecycleActionId/);
  assert.match(materializer, /depends_on_action_id/);
  assert.match(materializer, /create_branch.*create_or_update_file.*create_pull_request/s);
  assert.match(router, /assertMcpDependencyComplete/);
  assert.match(router, /dependencia previa no está completada/);
  assert.match(policy, /"create_or_update_file"/);
  assert.match(policy, /github: \[\/\^\(list_\|get_\|read_\|search_\)\//);
});

test("new repository bootstrap creates a usable default branch", async () => {
  const executor = await read("src/lib/github-runtime-executor.ts");
  assert.match(executor, /auto_init: true/);
  assert.match(executor, /executeGitHubCreateRepository/);
});

test("existing app mutation requests are classified for engineering", async () => {
  const drafts = await read("src/lib/nova-chat-action-drafts.ts");
  assert.match(drafts, /existingAppMutation/);
  assert.match(drafts, /return "github_code"/);
});


test("existing-app engineering reaches real inspection even when chat writes are disabled", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  assert.match(route, /routeThroughEngineeringRuntime/);
  assert.match(route, /draftPreview && !routeThroughEngineeringRuntime/);
  assert.match(route, /Existing-app engineering always reaches the real NOVA tool loop/);
});

test("engineering tool loop is bounded and fits the chat execution window", async () => {
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  assert.match(runtime, /MAX_MCP_FOLLOW_UPS = 2/);
  assert.match(runtime, /INITIAL_MCP_TIMEOUT_MS = 28_000/);
  assert.match(runtime, /FOLLOW_UP_MCP_TIMEOUT_MS = 12_000/);
  assert.match(runtime, /const maxFollowUps = engineeringTask \? MAX_MCP_FOLLOW_UPS : 1/);
  assert.match(runtime, /for \(let followUp = 0; followUp <= maxFollowUps/);
});

test("all GitHub file lifecycle mutations remain ordered before PR creation", async () => {
  const materializer = await read("src/lib/nova-mcp-action-materializer.ts");
  assert.match(materializer, /create_branch.*create_or_update_file.*create_file.*update_file.*create_pull_request/s);
});

async function bootstrapIdentity() {
  const source = await read("src/lib/nova-application-bootstrap-identity.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    module: mod,
    exports: mod.exports,
    require: createRequire(import.meta.url),
  });
  return mod.exports;
}

test("repeating the same new-app request reuses a stable bootstrap identity", async () => {
  const { stableNovaApplicationBootstrapId } = await bootstrapIdentity();
  const input = {
    project_id: "hocker-one",
    created_by: "owner-123-private",
    repository_name: "app-portal-cliente",
  };
  const first = stableNovaApplicationBootstrapId(input);
  assert.match(first, /^bootstrap_v2_[0-9a-f]{24}$/);
  assert.equal(stableNovaApplicationBootstrapId({ ...input }), first);
  assert.equal(stableNovaApplicationBootstrapId({ ...input, repository_name: "APP-PORTAL-CLIENTE" }), first);
  assert.notEqual(stableNovaApplicationBootstrapId({ ...input, repository_name: "app-portal-diferente" }), first);
  assert.notEqual(stableNovaApplicationBootstrapId({ ...input, created_by: "other-owner" }), first);
  assert.notEqual(stableNovaApplicationBootstrapId({ ...input, project_id: "other-project" }), first);
  assert.equal(first.includes("owner-123-private"), false);
  assert.throws(() => stableNovaApplicationBootstrapId({ ...input, created_by: "" }), /IDENTITY_INCOMPLETE/);
});

test("a rejected, failed or invalid GitHub parent cannot enqueue a Vercel child", async () => {
  const { githubBootstrapParentState } = await bootstrapIdentity();
  const id = "009a7e15-10d4-4a4e-9f08-acfe2bcd712e";
  for (const status of ["needs_approval", "approved", "executed", "completed"]) {
    const state = githubBootstrapParentState({ id, status });
    assert.equal(state.eligible, true, status);
    assert.equal(state.id, id);
  }
  for (const status of ["rejected", "cancelled", "failed", "execution_failed", "dead_letter",
    "needs_fix", "running", "queued", "", "unknown"]) {
    assert.equal(githubBootstrapParentState({ id, status }).eligible, false, status);
  }
  assert.equal(githubBootstrapParentState({ id: "", status: "approved" }).eligible, false);
  assert.equal(githubBootstrapParentState({ id: "forged-id", status: "executed" }).eligible, false);
});

test("GitHub -> Vercel chain uses the stable identity and checks its persisted parent", async () => {
  const materializer = await read("src/lib/nova-application-delivery-materializer.ts");
  const queue = await read("src/lib/agi-runtime-core.ts");
  assert.match(materializer, /stableNovaApplicationBootstrapId\(\{/);
  assert.match(materializer, /githubBootstrapParentState\(githubRow\)/);
  assert.match(materializer, /if \(!githubParent\.eligible \|\| !githubParent\.id\)/);
  assert.match(materializer, /depends_on_action_id: githubParent\.id/);
  assert.match(materializer, /GITHUB_BOOTSTRAP_PARENT_NOT_ELIGIBLE/);
  assert.match(materializer, /const vercelState = githubBootstrapParentState\(vercelRow\)/);
  assert.match(materializer, /VERCEL_BOOTSTRAP_ACTION_NOT_ELIGIBLE/);
  assert.match(materializer, /requires_approval: true/);
  assert.doesNotMatch(materializer, /Date\.now\(\)/);
  assert.doesNotMatch(materializer, /randomUUID\(/);
  const parentCheck = materializer.indexOf("if (!githubParent.eligible");
  const vercelEnqueue = materializer.indexOf("const vercel = await enqueueVercelProject");
  assert.ok(parentCheck >= 0 && vercelEnqueue > parentCheck);
  assert.match(queue, /function buildAgiActionIdempotencyKey/);
  assert.match(queue, /\.eq\("idempotency_key", idempotencyKey\)/);
});
