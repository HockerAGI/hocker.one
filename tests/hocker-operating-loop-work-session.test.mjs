import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("work-session persistence references existing Hocker authorities", async () => {
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");
  assert.match(sql, /references public\.projects\(id\)/);
  assert.match(sql, /references public\.agi_runs\(id\)/);
  assert.match(sql, /references public\.agi_tasks\(id\)/);
  assert.match(sql, /references public\.agi_action_queue\(id\)/);
  assert.match(sql, /public\.is_project_member/);
  assert.match(sql, /public\.is_project_operator/);
  assert.match(sql, /public\.is_project_owner/);
  assert.match(sql, /enable row level security/);
});

test("work-session store is idempotent and detects optimistic-concurrency conflicts", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  assert.match(store, /getByIdempotency/);
  assert.match(store, /idempotency_key/);
  assert.match(store, /\.eq\("version", current\.version\)/);
  assert.match(store, /WORK_SESSION_CONFLICT/);
  assert.match(store, /WORK_SESSION_EVENT_CREATE_FAILED/);
});

test("work-session events preserve monotonic state transition sequence", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  assert.match(store, /const nextVersion = current\.version \+ 1/);
  assert.match(store, /sequence: nextVersion/);
  assert.match(store, /order\("sequence", \{ ascending: true \}\)/);
});
