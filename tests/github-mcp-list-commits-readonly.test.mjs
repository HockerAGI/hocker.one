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
});

test("GitHub list_commits refuses ambiguous, invalid or conflicting repository selectors", () => {
  assert.throws(() => normalize({}),/GITHUB_MCP_REPOSITORY_REQUIRED/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"nova.agi",repository_full_name:"Other/repo"}),/GITHUB_MCP_CONFLICTING_REPOSITORY/);
  assert.throws(() => normalize({repository_full_name:"HockerAGI/hocker.one/other"}),/GITHUB_MCP_INVALID_REPOSITORY/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",perPage:0}),/GITHUB_MCP_INVALID_PER_PAGE/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",perPage:101}),/GITHUB_MCP_INVALID_PER_PAGE/);
  assert.throws(() => normalize({owner:"HockerAGI",repo:"hocker.one",sha:"../main"}),/GITHUB_MCP_INVALID_SHA/);
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
  assert.match(runtime,/assertMcpReadToolPolicy\(call\.provider, call\.tool, call\.args\)/);
  assert.match(runtime,/MCP_MUTATION_REQUIRES_HOCKER_ONE_OWNER_GATE/);
});
