import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pkg = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

function normalized(version) {
  return String(version ?? "").replace(/^[~^]/, "");
}

function majorMinor(version) {
  const match = normalized(version).match(/^(\d+)\.(\d+)\./);
  return match ? `${match[1]}.${match[2]}` : "";
}

test("Next runtime and lint tooling stay on one stable release line", () => {
  const versions = {
    next: pkg.dependencies?.next,
    eslintConfigNext: pkg.devDependencies?.["eslint-config-next"],
    eslintPluginNext: pkg.devDependencies?.["@next/eslint-plugin-next"],
  };

  for (const [name, version] of Object.entries(versions)) {
    assert.ok(version, `${name} must be declared`);
    assert.doesNotMatch(String(version), /canary|preview|beta|rc/i, `${name} must be stable`);
  }

  assert.equal(majorMinor(versions.next), "16.3");
  assert.equal(majorMinor(versions.eslintConfigNext), "16.3");
  assert.equal(majorMinor(versions.eslintPluginNext), "16.3");
});
