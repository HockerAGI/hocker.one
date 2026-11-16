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
  assert.match(bridge, /observedFile\.sha !== file\.expected_file_sha/);
  assert.match(bridge, /createGitHubWriteGatePlan\(operation/);
  assert.match(bridge, /tool_key: "github"/);
  assert.match(bridge, /action_type: "github\." \+ operation/);
  assert.match(bridge, /NOVA_GITHUB_GUIDED_CHAIN_VERSION/);
  assert.match(bridge, /requires_approval: true/);
  assert.match(executor, /export async function readGitHubBranchHeadSha/);
  assert.match(worker, /const expectedBaseSha = stringValue\(payload\.expected_base_sha\)/);
  assert.match(worker, /GITHUB_BASE_SHA_DRIFT/);
  assert.match(worker, /payload\.require_new_branch === true/);
  assert.match(route, /mcpBridge\.actions\.length === expectedCount/);
  assert.match(route, /todavía no se modificó GitHub/);
  assert.match(appContract, /assert\.doesNotMatch\(route, \/materializeNovaGitHubActionsFromChat\//);
  assert.match(ui, /shouldAllowActionDraft\(prompt\).*sendSingleResponse/);
});

test("NOVA handles 1-3 existing-file changes in one guarded lifecycle, retaining legacy shape", async () => {
  const parse = await parser();
  const one = parse(valid());
  assert.equal(one.changes.length, 1);
  assert.equal(one.changes[0].path, one.path);
  assert.equal(one.changes[0].expected_file_sha, one.expected_file_sha);

  const files = [
    { path: "src/lib/first.ts", expected_file_sha: "a".repeat(40), content: "export const first = 1;\n" },
    { path: "src/lib/second.ts", expected_file_sha: "b".repeat(40), content: "export const second = 2;\n" },
    { path: "docs/third.md", expected_file_sha: "c".repeat(40), content: "# Third\n" },
  ];
  const { path, expected_file_sha, content, ...base } = valid();
  const multi = parse({ ...base, changes: files });
  assert.equal(multi.changes.length, 3);
  assert.equal(multi.changes.map((entry) => entry.path).join(","), files.map((entry) => entry.path).join(","));
  assert.equal(multi.path, files[0].path);

  assert.throws(() => parse({ ...base, changes: [] }), /INVALID_FILES_COUNT/);
  assert.throws(() => parse({ ...base, changes: [...files, ...files.slice(0, 1)] }), /INVALID_FILES_COUNT/);
  assert.throws(() => parse({ ...base, changes: [files[0], files[0]] }), /DUPLICATE_FILE_PATH/);
  assert.throws(() => parse({ ...base, changes: [...files, { ...files[0] }] }), /INVALID_FILES_COUNT/);
  assert.throws(() => parse({ ...valid(), changes: files }), /MIXED_FORMS/);
  assert.throws(() => parse({ ...base, changes: [{ ...files[0], path: "src/.env" }] }), /PATH_NOT_ALLOWED/);
  assert.throws(() => parse({ ...base, changes: [{ ...files[0], expected_file_sha: "unknown" }] }), /OBSERVED_SHA_REQUIRED/);
  assert.throws(() => parse({ ...base, changes: [{ ...files[0], token: "x" }] }), /UNEXPECTED_ARGUMENT/);
  assert.throws(() => parse({ ...base, changes: [
    { ...files[0], content: "A".repeat(7000) }, { ...files[1], content: "B".repeat(6000) },
  ] }), /CONTENT_INVALID_OR_SENSITIVE/);
});

test("the existing GitHub materializer preflights every file before the first queued write", async () => {
  const [bridge, runtime, worker, ownerUi, route] = await Promise.all([
    read("src/lib/nova-mcp-action-materializer.ts"),
    read("src/lib/agi-mcp-runtime.ts"),
    read("src/lib/agi-action-execution.ts"),
    read("src/components/nova-chat-helpers.ts"),
    read("src/app/api/nova/chat/route.ts"),
  ]);
  assert.match(bridge, /for \(const file of proposal\.changes\)/);
  assert.match(bridge, /observedFile\.sha !== file\.expected_file_sha/);
  assert.match(bridge, /\.\.\.proposal\.changes\.map/);
  assert.match(bridge, /sequence_index: stepIndex/);
  assert.ok(bridge.indexOf("for (const file of proposal.changes)") < bridge.indexOf("const row = await enqueueAgiAction("));
  assert.match(worker, /aPayload\.source === "nova_native_github_proposal"/);
  assert.match(worker, /Number\.isInteger\(aPayload\.sequence_index\)/);
  assert.match(ownerUi, /const isNativeBatch = group\.some/);
  assert.match(ownerUi, /total: ordered\.length/);
  assert.match(runtime, /maxItems: 3/);
  assert.match(runtime, /changes: \{/);
  assert.match(route, /const expectedCount = fileCount \+ 2/);
});

test("guided Owner review surfaces ALL file writes in sequence, not just the latest upsert", async () => {
  const source = await read("src/components/nova-chat-helpers.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: testModule, exports: testModule.exports,
    require(id) {
      if (id === "./nova-chat-types") {
        return {
          GUIDED_GITHUB_ACTION_ORDER: ["github.create_branch", "github.upsert_file", "github.create_pr"],
          GUIDED_GITHUB_TERMINAL_STATUSES: new Set(["executed", "completed", "rejected", "cancelled", "canceled"]),
          NATIVE_CAPABILITIES: [],
        };
      }
      throw new Error("unexpected import " + id);
    },
  });
  const base = { tool_key: "github", status: "needs_approval", created_at: "2026-11-16T03:00:00Z" };
  const actions = ["github.create_branch", "github.upsert_file", "github.upsert_file", "github.upsert_file", "github.create_pr"].map(
    (action_type, index) => ({
      ...base, id: "step-" + index, action_type,
      payload: { branch: "nova/batch-check", target_branch: "nova/batch-check",
        source: "nova_native_github_proposal", materializer_version: "12.7K-2A",
        sequence_index: index },
    }),
  );
  const chain = testModule.exports.buildGuidedGitHubChain(actions);
  assert.equal(chain.total, 5);
  assert.equal(chain.completed, 0);
  assert.equal(chain.actions.map((action) => action.id).join(","), "step-0,step-1,step-2,step-3,step-4");
  assert.equal(chain.nextAction.id, "step-0");
  actions[0].status = "executed";
  assert.equal(testModule.exports.buildGuidedGitHubChain(actions).nextAction.id, "step-1");
});
