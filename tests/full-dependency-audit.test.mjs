import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(
  await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
);

test("brace-expansion vulnerable 1.1.x release is overridden", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");

  assert.equal(manifest.overrides?.["brace-expansion"], "1.1.17");
  assert.equal(lockfile.packages?.["node_modules/brace-expansion"]?.version, "1.1.17");

  for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!path.endsWith("node_modules/brace-expansion")) continue;
    const version = metadata?.version;
    assert.notEqual(version, "1.1.16", `${path} must not use vulnerable brace-expansion 1.1.16`);
  }
});

test("CI audits production and development dependencies", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /name: Full dependency audit/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.doesNotMatch(workflow, /npm audit --omit=dev/);
});
