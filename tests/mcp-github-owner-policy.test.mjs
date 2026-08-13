import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("GitHub MCP Owner Gate covers all six operational HOCKER repositories", async () => {
  const policy = await read("src/lib/mcp/mcp-policy.ts");

  assert.match(policy, /HockerAGI\/hocker\.one/);
  assert.match(policy, /HockerAGI\/nova\.agi/);
  assert.match(policy, /HockerAGI\/hocker-node-agent/);
  assert.match(policy, /HockerAGI\/chido\.casino/);
  assert.match(policy, /HockerAGI\/hocker\.agi/);
  assert.match(policy, /HockerAGI\/hocker\.ads/);
  assert.match(policy, /HOCKER_GITHUB_ALLOWED_REPOS/);
  assert.match(policy, /Repositorio GitHub fuera de allowlist/);
});

test("GitHub MCP writes cannot target main or secret-bearing files", async () => {
  const policy = await read("src/lib/mcp/mcp-policy.ts");

  assert.match(policy, /La escritura directa a una rama principal está bloqueada/);
  assert.match(policy, /Path sensible bloqueado por Owner Gate/);
  assert.match(policy, /GITHUB_MUTATION_TOOLS/);
  assert.doesNotMatch(policy, /"merge_pull_request",/);
  assert.doesNotMatch(policy, /"delete_file",/);
});
