import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("final GitHub executor covers all five HOCKER repositories", async () => {
  const source = await read("src/lib/agi-action-execution.ts");

  assert.match(source, /HockerAGI\/hocker\.one,HockerAGI\/nova\.agi,HockerAGI\/hocker-node-agent,HockerAGI\/chido\.casino,HockerAGI\/hocker\.agi/);
  assert.match(source, /HOCKER_GITHUB_ALLOWED_REPOS/);
  assert.match(source, /Repositorio no permitido para ejecución AGI/);
});

test("final executor still blocks principal branches and sensitive paths", async () => {
  const source = await read("src/lib/agi-action-execution.ts");

  assert.match(source, /Escritura directa a rama principal bloqueada por Owner Gate/);
  assert.match(source, /Path sensible bloqueado/);
  assert.match(source, /isMockedGithubBoundary/);
});
