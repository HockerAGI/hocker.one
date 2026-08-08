import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy command creation derives approval from a server-owned policy", async () => {
  const route = await read("src/app/api/commands/route.ts");

  assert.match(route, /getLegacyCommandPolicy/);
  assert.match(route, /const\s+commandPolicy\s*=\s*getLegacyCommandPolicy\(command,\s*ctx\.role\)/);
  assert.match(route, /const\s+needsApproval\s*=\s*commandPolicy\.requires_approval/);
  assert.doesNotMatch(route, /body\.needs_approval/);
  assert.doesNotMatch(route, /body\.needsApproval/);
});

test("legacy cloud executor proves an atomic claim before executing side effects", async () => {
  const source = await read("src/app/api/commands/_cloud.ts");

  assert.match(source, /\.eq\("status",\s*"queued"\)[\s\S]*?\.eq\("needs_approval",\s*false\)[\s\S]*?\.select\("\*"\)[\s\S]*?\.maybeSingle/);
  assert.match(source, /if\s*\(!claimedCommand\)/);
  assert.match(source, /await\s+executeLocalCloud\(claimed\.command,\s*claimed\.payload/);
});
