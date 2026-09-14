import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("work-session migration references existing Hocker authorities instead of duplicating state", async () => {
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");
  assert.match(sql, /references public\.projects\(id\)/);
  assert.match(sql, /references public\.agi_runs\(id\)/);
  assert.match(sql, /references public\.agi_tasks\(id\)/);
  assert.match(sql, /references public\.agi_action_queue\(id\)/);
  assert.match(sql, /public\.is_project_member/);
  assert.match(sql, /public\.is_project_operator/);
  assert.match(sql, /public\.is_project_owner/);
  assert.match(sql, /alter table public\.hocker_work_sessions enable row level security/);
  assert.match(sql, /alter table public\.hocker_work_session_events enable row level security/);
});

test("work-session store enforces valid transitions and optimistic concurrency", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  assert.match(store, /assertValidWorkSessionTransition/);
  assert.match(store, /\.eq\("version", current\.version\)/);
  assert.match(store, /WORK_SESSION_CONFLICT/);
  assert.match(store, /WORK_SESSION_IDEMPOTENCY_LOOKUP_FAILED/);
  assert.match(store, /WORK_SESSION_EVENT_CREATE_FAILED/);
});

test("work-session store links durable identifiers but does not create a second queue/memory authority", async () => {
  const types = await read("src/lib/hocker-operating-loop/types.ts");
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  assert.match(types, /run_id: z\.string\(\)\.uuid/);
  assert.match(types, /task_id: z\.string\(\)\.uuid/);
  assert.match(types, /action_id: z\.string\(\)\.uuid/);
  assert.match(types, /evidence_id: z\.string\(\)\.uuid/);
  assert.match(store, /agi_sessions|hocker_work_sessions/);
  assert.doesNotMatch(store, /create.*queue/i);
  assert.doesNotMatch(store, /memory.*store/i);
});
