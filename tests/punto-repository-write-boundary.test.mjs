import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

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


test("NOVA/AGI writes require an exact allowlisted repository, not organization-only access", async () => {
  const source = await read("src/lib/github-repository-governance.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  function policy(env = {}) {
    const mod = { exports: {} };
    vm.runInNewContext(compiled, { module: mod, exports: mod.exports, process: { env } });
    return mod.exports.assertGithubAgiExecutionRepositoryAllowed;
  }

  const check = policy();
  for (const repository of ["HockerAGI/hocker.one", "HockerAGI/nova.agi", "HockerAGI/hocker-node-agent"]) {
    assert.doesNotThrow(() => check(repository));
  }
  for (const repository of ["HockerAGI/chido.casino", "HockerAGI/new-private-app", "HockerAGI/punto.g", "OtherOrg/hocker.one", "HockerAGI/hocker.one/extra"]) {
    assert.throws(() => check(repository), /GITHUB_AGI_WRITE_REPOSITORY_NOT_ALLOWED|solo lectura/);
  }
  const configured = policy({
    HOCKER_GITHUB_ORG: "HockerAGI",
    HOCKER_GITHUB_ALLOWED_REPOS: "HockerAGI/hocker.one, HockerAGI/chido.casino",
  });
  assert.doesNotThrow(() => configured(" hockeragi/CHIDO.CASINO "));
  assert.throws(() => configured("HockerAGI/nova.agi"), /GITHUB_AGI_WRITE_REPOSITORY_NOT_ALLOWED/);
  assert.throws(() => configured("OtherOrg/other"), /GITHUB_AGI_WRITE_REPOSITORY_NOT_ALLOWED/);
  const protectedRepo = policy({ HOCKER_GITHUB_ALLOWED_REPOS: "HockerAGI/punto.g" });
  assert.throws(() => protectedRepo("HockerAGI/punto.g"), /solo lectura/);
});

test("both GitHub mutation executors enforce the AGI allowlist before provider calls", async () => {
  const [worker, executor] = await Promise.all([
    read("src/lib/agi-action-execution.ts"),
    read("src/lib/github-runtime-executor.ts"),
  ]);
  assert.match(worker, /assertGithubAgiExecutionRepositoryAllowed\(fullName\)/);
  assert.match(executor, /operation !== "create_repository"\) assertGithubAgiExecutionRepositoryAllowed\(fullName\)/);
  assert.doesNotMatch(worker, /orgAllowed|!exactAllowed && !orgAllowed/);
});
