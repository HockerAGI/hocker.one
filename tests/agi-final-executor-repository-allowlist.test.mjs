import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("final GitHub executor preserves six repositories via shared exact-match authorization", async () => {
  const [worker, governance] = await Promise.all([
    read("src/lib/agi-action-execution.ts"),
    read("src/lib/github-repository-governance.ts"),
  ]);

  for (const repo of ["hocker.one", "nova.agi", "hocker-node-agent", "chido.casino", "hocker.agi", "hocker.ads"]) {
    assert.ok(governance.includes('"hockeragi/' + repo + '"'), "missing default repository: " + repo);
  }
  assert.match(governance, /HOCKER_GITHUB_ALLOWED_REPOS/);
  assert.match(governance, /GITHUB_AGI_WRITE_REPOSITORY_NOT_ALLOWED/);
  assert.match(worker, /assertGithubAgiExecutionRepositoryAllowed\(fullName\)/);
  assert.doesNotMatch(worker, /orgAllowed|!exactAllowed && !orgAllowed/);
});

test("final executor still blocks principal branches and sensitive paths", async () => {
  const source = await read("src/lib/agi-action-execution.ts");

  assert.match(source, /Escritura directa a rama principal bloqueada por Owner Gate/);
  assert.match(source, /Path sensible bloqueado/);
  assert.match(source, /isMockedGithubBoundary/);
});
