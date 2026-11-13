import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("PUNTO.G denied for AGI writes but other governed repositories remain usable", async () => {
  const source = await read("src/lib/github-repository-governance.ts");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const { assertGithubRepositoryWriteAuthorized } = await import("data:text/javascript," + encodeURIComponent(js));
  assert.throws(() => assertGithubRepositoryWriteAuthorized("HockerAGI/punto.g"), /solo lectura/);
  assert.throws(() => assertGithubRepositoryWriteAuthorized(" hockeragi/PUNTO.G "), /solo lectura/);
  assert.doesNotThrow(() => assertGithubRepositoryWriteAuthorized("HockerAGI/hocker.one"));
  assert.doesNotThrow(() => assertGithubRepositoryWriteAuthorized("HockerAGI/chido.games"));
  assert.doesNotThrow(() => assertGithubRepositoryWriteAuthorized("HockerAGI/new-private-app"));
});

test("read-only exception is enforced at every AGI GitHub mutation gateway", async () => {
  const [policy, worker, executor] = await Promise.all([
    read("src/lib/mcp/mcp-policy.ts"),
    read("src/lib/agi-action-execution.ts"),
    read("src/lib/github-runtime-executor.ts"),
  ]);
  assert.match(policy, /assertGithubRepositoryWriteAuthorized\(repository\)/);
  assert.match(worker, /assertGithubRepositoryWriteAuthorized\(fullName\)/);
  assert.match(executor, /operation !== "create_repository"\) assertGithubRepositoryWriteAuthorized\(fullName\)/);
  assert.match(policy, /githubReadRepository\(args\)/);
  assert.match(executor, /async function readFile\(/);
});
