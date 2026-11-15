import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel REST v6 uid and v13 id share one strict normalized identity", () => {
  const script = [
    "import assert from 'node:assert/strict';",
    "import { deploymentIdFromRestRow as get } from './src/lib/vercel-deployment-id.ts';",
    "const id = 'dpl_AJhqmzvdtxWwV1XvQX4MiXuJqHt9';",
    // Actual v6 list row uses uid while MCP tools expose id.
    "assert.equal(get({ uid: id, target: 'production', state: 'READY' }), id);",
    "assert.equal(get({ id, target: 'production', state: 'READY' }), id);",
    "assert.equal(get({ id, uid: id }), id);",
    "assert.equal(get({ id, uid: 'dpl_DIFFERENT' }), null);",
    "assert.equal(get({ uid: '' }), null);",
    "assert.equal(get({ uid: 'bad-id' }), null);",
    "assert.equal(get({ uid: 42 }), null);",
    "assert.equal(get({}), null);",
  ].join("\n");
  const run = spawnSync(process.execPath, [
    "--experimental-strip-types", "--input-type=module", "--eval", script,
  ], { cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 10000 });
  assert.equal(run.status, 0, run.stderr);
});

test("continuity requires authenticated REST and exact live alias even for uid-only list rows", async () => {
  const cont = await readFile(
    new URL("../src/lib/project-continuity.ts", import.meta.url), "utf8",
  );
  assert.match(cont, /deploymentIdFromRestRow\(row\)/);
  assert.match(cont, /deploymentIdFromRestRow\(record\) !== candidateId/);
  assert.match(cont, /row\.target === "production"/);
  assert.match(cont, /latestProduction\.state !== "READY"/);
  assert.match(cont, /sha !== expectedMainSha/);
  assert.match(cont, /getVercelProductionAlias/);
  assert.match(cont, /alias\.deploymentId !== id/);
  assert.match(cont, /alias\.projectId !== HOCKER_ONE_VERCEL_PROJECT_ID/);
  assert.match(cont, /status: verified \? "verified" : "partial"/);
  assert.doesNotMatch(cont, /VERCEL_TOKEN\s*=/);
});
