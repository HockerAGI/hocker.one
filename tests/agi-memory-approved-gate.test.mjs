import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("pure memory policy accepts approved learning and canonical migration profiles only", () => {
  const script = [
    "import { isMemoryApprovedForAgi } from './src/lib/agi-memory-policy.ts';",
    "const now = Date.parse('2026-11-13T16:00:00Z');",
    "const row = {id:'m',project_id:'hocker-one',active:true,safety_status:'safe',",
    "approved_by_nova:true,approved_by_syntia:true,approved_by_vertx:true,approved_by_jurix:true,",
    "learning_event_id:'l',source_hash:'sha',source_type:'internal_metric',source_name:'NOVA',",
    "canonical_memory_key:'mirror:m',valid_from:'2026-01-01T00:00:00Z',expires_at:null};",
    "const approved = new Map([['l',{id:'l',project_id:'hocker-one',status:'approved',source_hash:'sha'}]]);",
    "const pending = new Map([['l',{id:'l',project_id:'hocker-one',status:'pending_review',source_hash:'sha'}]]);",
    "const check = (r, l) => isMemoryApprovedForAgi(r,l,'hocker-one',now);",
    "console.log(JSON.stringify([",
    "check(row,approved), check(row,pending),",
    "check({...row,approved_by_vertx:false},approved),",
    "check({...row,source_hash:'different'},approved),",
    "check({...row,project_id:'other'},approved),",
    "check({...row,expires_at:'2026-01-01T00:00:00Z'},approved),",
    "check({...row,learning_event_id:null,source_type:'owner_note'},approved),",
    "check({...row,learning_event_id:null,source_type:'official_source',source_name:'HOCKER AGI Canon 12.6C.1B',canonical_memory_key:'canon.profile.nova.12_6c_1b'},approved),",
    "]));",
  ].join("\n");
  const run = spawnSync(process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    { cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 10_000 });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout.trim()), [true,false,false,false,false,false,false,true]);
});

test("AGI context blocks partially approved and pending-learning memories before prompts", async () => {
  const code = await read("src/lib/agi-context-builder.ts");
  for (const flag of ["approved_by_nova","approved_by_syntia","approved_by_vertx","approved_by_jurix"]) {
    assert.ok(code.includes('.eq("' + flag + '", true)'));
  }
  assert.match(code, /resolveApprovedMemoryIds\(rows, input\.project_id\)/);
  assert.ok(code.indexOf("resolveApprovedMemoryIds(rows") < code.indexOf("Memory Mirror seguro, activo y aplicable"));
});

test("Memory Mirror GET is fail-closed by default and retains explicit Owner audit mode", async () => {
  const code = await read("src/app/api/agi/memory-mirror/route.ts");
  assert.match(code, /if \(!includeInactive\)/);
  assert.match(code, /resolveApprovedMemoryIds\(/);
  assert.match(code, /memory_approval_check_unavailable/);
  assert.match(code, /requireOwnerOrInternal/);
});

test("active AGI feeds must point to an eligible mirror row; historical review rows remain inspectable", async () => {
  const code = await read("src/app/api/agi/updates/feed/route.ts");
  assert.match(code, /resolveApprovedMemoryIds\(memories/);
  assert.match(code, /row\.status !== "active"/);
  assert.match(code, /feed_memory_approval_check_failed/);
  assert.match(code, /requireOwnerOrInternal/);
});
