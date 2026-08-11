import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Hocker ONE delegates casino money mutations to atomic RPCs", async () => {
  const route = await read("src/app/api/chido/admin/route.ts");
  assert.match(route, /admin_confirm_manual_deposit/);
  assert.match(route, /admin_settle_withdrawal/);
  assert.doesNotMatch(route, /currentBalance\s*\+/);
  assert.doesNotMatch(route, /currentLocked\s*-/);
  assert.doesNotMatch(route, /from\("transactions"\)\.insert/);
});

test("shared casino kill switch uses the canonical composite key", async () => {
  const route = await read("src/app/api/chido/admin/route.ts");
  assert.match(route, /chido-casino-games/);
  assert.match(route, /onConflict: "project_id,id"/);
  assert.match(route, /fail_closed: true/);
});

test("runtime dependencies are patched", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.dependencies.next, "16.2.12");
  assert.equal(pkg.dependencies.react, "19.2.8");
  assert.equal(pkg.dependencies.sharp, "0.35.3");
});
