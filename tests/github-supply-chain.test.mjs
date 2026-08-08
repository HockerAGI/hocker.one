import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const REQUIRED_FILES = [
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".github/workflows/codeql.yml",
  "SECURITY.md",
];

test("repository declares code ownership, dependency updates, CodeQL and security reporting", async () => {
  for (const path of REQUIRED_FILES) {
    const content = await read(path);
    assert.ok(content.trim().length > 0, `${path} must exist and be non-empty`);
  }
});

test("every external GitHub Action is pinned to a full immutable commit SHA", async () => {
  const workflowsDir = new URL("../.github/workflows/", import.meta.url);
  const files = (await readdir(workflowsDir)).filter((name) => /\.ya?ml$/i.test(name));
  const violations = [];

  for (const file of files) {
    const source = await read(`.github/workflows/${file}`);
    for (const [index, line] of source.split("\n").entries()) {
      const match = line.match(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/);
      if (!match) continue;
      const ref = match[1];
      if (ref.startsWith("./") || ref.startsWith("docker://")) continue;
      if (!/@[0-9a-f]{40}$/i.test(ref)) {
        violations.push(`${file}:${index + 1}: ${ref}`);
      }
    }
  }

  assert.deepEqual(violations, [], `Unpinned actions:\n${violations.join("\n")}`);
});
