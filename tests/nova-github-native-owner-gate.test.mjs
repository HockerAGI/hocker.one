import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

async function parser() {
  const source = await read("src/lib/nova-github-proposal.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: compiledModule,
    exports: compiledModule.exports,
    Buffer,
    require(id) {
      if (id === "@/lib/github-repository-governance") {
        return { assertGithubRepositoryWriteAuthorized() {} };
      }
      throw new Error("Unexpected dependency: " + id);
    },
  });
  return compiledModule.exports.parseNovaGithubCodeProposal;
}

const valid = () => ({
  repository: "HockerAGI/hocker.one",
  branch: "nova/review-fix-20261115",
  expected_base_sha: "a".repeat(40),
  path: "src/lib/example.ts",
  expected_file_sha: "b".repeat(40),
  content: "export const verified = true;\n",
  commit_message: "fix(nova): apply verified correction",
  pr_title: "fix(nova): verified repository correction",
  pr_body: "Exact-SHA read, owner review, CI, and rollback required.",
});

test("NOVA native proposal validates actual code and only the three Owner-authorized repositories", async () => {
  const parse = await parser();
  assert.equal(parse(valid()).content, valid().content);
  for (const repository of ["HockerAGI/hocker.one", "HockerAGI/nova.agi", "HockerAGI/hocker-node-agent"]) {
    assert.equal(parse({ ...valid(), repository }).repository, repository);
  }
  for (const repository of ["HockerAGI/punto.g", "HockerAGI/chido.casino", "another/repo"]) {
    assert.throws(() => parse({ ...valid(), repository }), /REPOSITORY_NOT_AUTHORIZED/);
  }
});

test("NOVA proposal never accepts main, file traversal, missing SHA or secret-like code", async () => {
  const parse = await parser();
  for (const branch of ["main", "feature/test", "nova/../main", "nova/x//main", "nova/foo.lock"]) {
    assert.throws(() => parse({ ...valid(), branch }), /BRANCH_NOT_ALLOWED/);
  }
  for (const path of ["supabase/migrations/privileged.sql", "src/../.env", "src/.env", "src/private.key", "/src/lib/x.ts"]) {
    assert.throws(() => parse({ ...valid(), path }), /PATH_NOT_ALLOWED/);
  }
  assert.throws(() => parse({ ...valid(), expected_file_sha: "unknown" }), /OBSERVED_SHA_REQUIRED/);
  assert.throws(() => parse({ ...valid(), expected_base_sha: "unknown" }), /OBSERVED_SHA_REQUIRED/);
  assert.throws(() => parse({ ...valid(), content: "A".repeat(13 * 1024) }), /CONTENT_INVALID_OR_SENSITIVE/);
  assert.throws(() => parse({ ...valid(), content: "sk-proj-" + "A".repeat(30) }), /CONTENT_INVALID_OR_SENSITIVE/);
  assert.throws(() => parse({ ...valid(), extra_control: true }), /UNEXPECTED_ARGUMENT/);
});

test("NOVA native engineering tool never sends a write call to GitHub read-only MCP", async () => {
  const [native, github, unified, policy] = await Promise.all([
    read("src/lib/agi-mcp-runtime.ts"),
    read("src/lib/mcp/mcp-github.ts"),
    read("src/lib/unified-nova-chat-runtime.ts"),
    read("src/lib/nova-github-proposal.ts"),
  ]);
  assert.match(github, /https:\/\/api\.githubcopilot\.com\/mcp\/readonly/);
  assert.match(github, /"X-MCP-Readonly": "true"/);
  assert.match(native, /hocker__github__propose_code_change/);
  assert.match(native, /call\.provider === "github" && call\.tool === NOVA_GITHUB_PROPOSAL_TOOL/);
  assert.match(native, /if \(!options\.allow_actions \|\| !hasGitHubRuntimeToken\(\)\)/);
  assert.match(native, /needs_approval: true/);
  assert.match(native, /executed: false/);
  assert.match(native, /buildAgiNativeMcpTools\(query\?: string, allow_actions = false\)/);
  assert.match(unified, /buildAgiNativeMcpTools\(params\.message, Boolean\(params\.allow_actions\)\)/);
  assert.match(policy, /NOVA_GITHUB_REPOSITORY_NOT_AUTHORIZED/);
});

test("NOVA file changes go into the existing protected GitHub queue, with verified base and blob SHA", async () => {
  const [bridge, executor, worker, route, appContract, ui] = await Promise.all([
    read("src/lib/nova-mcp-action-materializer.ts"),
    read("src/lib/github-runtime-executor.ts"),
    read("src/lib/agi-action-execution.ts"),
    read("src/app/api/nova/chat/route.ts"),
    read("tests/application-delivery-fabric.test.mjs"),
    read("src/components/NovaRealtimeChat.tsx"),
  ]);
  assert.match(bridge, /getAgiQueueLock\(params\.project_id\)/);
  assert.match(bridge, /rawDrafts\.filter\(isNativeGithubProposalDraft\)\.length > 1/);
  assert.match(bridge, /readGitHubBranchHeadSha\(proposal\.repository, "main"\)/);
  assert.match(bridge, /readGitHubBranchHeadSha\(proposal\.repository, proposal\.branch\)/);
  assert.match(bridge, /executeGitHubReadOperation\("read_file"/);
  assert.match(bridge, /observedFile\.sha !== proposal\.expected_file_sha/);
  assert.match(bridge, /createGitHubWriteGatePlan\(operation/);
  assert.match(bridge, /tool_key: "github"/);
  assert.match(bridge, /action_type: "github\." \+ operation/);
  assert.match(bridge, /NOVA_GITHUB_GUIDED_CHAIN_VERSION/);
  assert.match(bridge, /requires_approval: true/);
  assert.match(executor, /export async function readGitHubBranchHeadSha/);
  assert.match(worker, /const expectedBaseSha = stringValue\(payload\.expected_base_sha\)/);
  assert.match(worker, /GITHUB_BASE_SHA_DRIFT/);
  assert.match(worker, /payload\.require_new_branch === true/);
  assert.match(route, /mcpBridge\.actions\.length === 3/);
  assert.match(route, /todavía no se modificó GitHub/);
  assert.match(appContract, /assert\.doesNotMatch\(route, \/materializeNovaGitHubActionsFromChat\//);
  assert.match(ui, /shouldAllowActionDraft\(prompt\).*sendSingleResponse/);
});
