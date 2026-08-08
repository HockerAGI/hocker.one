import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(
  await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
);

const parseVersion = (version) => String(version ?? "")
  .replace(/^v/, "")
  .split(".")
  .map((part) => Number.parseInt(part, 10));

const atLeast = (version, minimum) => {
  const current = parseVersion(version);
  const required = parseVersion(minimum);
  for (let i = 0; i < Math.max(current.length, required.length); i += 1) {
    const a = current[i] ?? 0;
    const b = required[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
};

test("brace-expansion vulnerable 1.1.x release is overridden", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");

  assert.equal(manifest.overrides?.["brace-expansion"], "1.1.18");
  assert.equal(lockfile.packages?.["node_modules/brace-expansion"]?.version, "1.1.18");

  for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!path.endsWith("node_modules/brace-expansion")) continue;
    const version = metadata?.version;
    assert.notEqual(version, "1.1.16", `${path} must not use vulnerable brace-expansion 1.1.16`);
    assert.notEqual(version, "1.1.17", `${path} must not use vulnerable brace-expansion 1.1.17`);
  }
});

test("postcss vulnerable releases are overridden", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");

  assert.equal(manifest.devDependencies?.postcss, "8.5.23");
  assert.equal(manifest.overrides?.postcss, "8.5.23");
  assert.equal(lockfile.packages?.["node_modules/postcss"]?.version, "8.5.23");
});

test("js-yaml legacy line is pinned to the CVE-2026-59870 patched release", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");

  assert.equal(manifest.overrides?.["js-yaml"], "4.3.1");

  for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!path.endsWith("node_modules/js-yaml")) continue;
    const version = metadata?.version;
    assert.ok(atLeast(version, "4.3.1"), `${path} must use js-yaml >= 4.3.1; found ${version}`);
  }
});

test("nanoid legacy line is pinned to the CVE-2026-67213 patched release", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");

  assert.equal(manifest.overrides?.nanoid, "3.3.17");

  for (const [path, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!path.endsWith("node_modules/nanoid")) continue;
    const version = metadata?.version;
    assert.ok(atLeast(version, "3.3.17"), `${path} must use nanoid >= 3.3.17; found ${version}`);
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
