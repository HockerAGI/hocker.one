import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { normalizeGitHubListCommitsArguments as normalize } from "../src/lib/mcp/mcp-github-read-arguments.ts";

test("GitHub list_commits converts natural tool aliases to documented owner/repo schema", () => {
  assert.deepEqual(normalize({
    repository_full_name: "HockerAGI/hocker.one",
    ref: "refs/heads/main",
    per_page: 1,
    unexpected: "must never reach MCP",
  }), { owner: "HockerAGI", repo: "hocker.one", sha: "main", perPage: 1 });
  assert.deepEqual(normalize({ owner:"HockerAGI",repo:"hocker.one",sha:"main",perPage:1 }),
    { owner:"HockerAGI",repo:"hocker.one",sha:"main",perPage:1 });
  assert.deepEqual(normalize({ repo:"HockerAGI/hocker.one",limit:1 }),
    { owner:"HockerAGI",repo:"hocker.one",perPage:1 });
  assert.deepEqual(normalize({owner:"HockerAGI",repo:"hocker.one",branch:"release/1.0+hotfix"}),
    {owner:"HockerAGI",repo:"hocker.one",sha:"release/1.0+hotfix"});
  assert.deepEqual(normalize({owner:"HockerAGI",repo:"hocker.one",sha:"user@work"}),
    {owner:"HockerAGI",repo:"hocker.one",sha:"user@work"});
});

test("GitHub list_commits refuses ambiguous, invalid or conflicting repository selectors", () => {
  assert.throws(() => normalize({}),/GITHUB_MCP_REPOSITORY_REQUIRED/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"nova.agi",repository_full_name:"Other/repo"}),/GITHUB_MCP_CONFLICTING_REPOSITORY/);
  assert.throws(() => normalize({repository_full_name:"HockerAGI/hocker.one/other"}),/GITHUB_MCP_INVALID_REPOSITORY/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",perPage:0}),/GITHUB_MCP_INVALID_PER_PAGE/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",perPage:101}),/GITHUB_MCP_INVALID_PER_PAGE/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",sha:"../main"}),/GITHUB_MCP_INVALID_SHA/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",sha:"main@{1"}),/GITHUB_MCP_INVALID_SHA/);
  assert.deepEqual(normalize({repo:"OtherOrg/private-repo",perPage:1}),
    {owner:"OtherOrg",repo:"private-repo",perPage:1}); // Runtime must then authorize this normalized target.
});

test("Owner direct MCP endpoint authorizes the final normalized GitHub target", async () => {
  const route = await readFile(
    new URL("../src/app/api/mcp/execute/route.ts", import.meta.url), "utf8",
  );
  const normalization = route.indexOf('normalizeGitHubListCommitsArguments(args ?? {})');
  const policy = route.indexOf('assertMcpReadToolPolicy(provider, tool, safeArgs)');
  const dispatch = route.indexOf('registry.executeTool(provider, tool, safeArgs)');
  assert.ok(normalization > 0 && policy > normalization && dispatch > policy,
    "Direct MCP reads must authorize the exact destination before dispatch");
  assert.match(route, /requireOwnerOrInternal/);
  assert.match(route, /MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE/);
});

test("MCP connector sends normalized arguments without changing mutation or Owner Gate policy", async () => {
  const [registry, policy, runtime] = await Promise.all([
    readFile(new URL("../src/lib/mcp/mcp-registry.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/mcp/mcp-policy.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/agi-mcp-runtime.ts",import.meta.url),"utf8"),
  ]);
  assert.match(registry,/providerId === "github" && toolName === "list_commits"/);
  assert.match(registry,/normalizeGitHubListCommitsArguments\(args \?\? \{\}\)/);
  assert.match(registry,/argument_keys: Object\.keys\(args \?\? \{\}\)/);
  assert.match(policy,/assertMcpReadToolPolicy/);
  assert.match(runtime,/assertMcpReadToolPolicy\(call\.provider, call\.tool, authorizedArgs\)/);
  assert.match(runtime,/MCP_MUTATION_REQUIRES_HOCKER_ONE_OWNER_GATE/);
  const normalizeAt = runtime.indexOf("normalizeGitHubListCommitsArguments(call.args)");
  const policyAt = runtime.indexOf("assertMcpReadToolPolicy(call.provider, call.tool, authorizedArgs)");
  const executeAt = runtime.indexOf("registry.executeTool(call.provider, call.tool, authorizedArgs)");
  assert.ok(normalizeAt >= 0 && policyAt > normalizeAt && executeAt > policyAt,
    "MCP read policy must validate the normalized destination before dispatch");
});
