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
  assert.match(sql, /lower\(pm\.role\) = 'owner'/);
  assert.match(sql, /enable row level security/);
});

test("work-session writes use atomic Postgres RPC functions", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");

  assert.match(store, /rpc\("hocker_create_work_session"/);
  assert.match(store, /rpc\("hocker_transition_work_session"/);
  assert.doesNotMatch(store, /\.from\("hocker_work_session_events"\)\.insert/);
  assert.match(sql, /create or replace function public\.hocker_create_work_session/);
  assert.match(sql, /create or replace function public\.hocker_transition_work_session/);
  assert.match(sql, /language plpgsql/);
});

test("work-session transitions serialize concurrent updates", async () => {
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");
  assert.match(sql, /from public\.hocker_work_sessions[\s\S]*for update;/);
  assert.match(sql, /v_next_version := v_current\.version \+ 1/);
  assert.match(sql, /unique \(work_session_id, sequence\)/);
});

test("work-session idempotency and invalid-transition contracts remain explicit", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");

  assert.match(store, /idempotency_key/);
  assert.match(store, /WORK_SESSION_TRANSITION_FAILED/);
  assert.match(sql, /unique \(project_id, idempotency_key\)/);
  assert.match(sql, /INVALID_WORK_SESSION_TRANSITION:/);
  assert.match(sql, /WORK_SESSION_NOT_FOUND/);
});

test("work-session events preserve monotonic state transition sequence", async () => {
  const store = await read("src/lib/hocker-operating-loop/store.ts");
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");
  assert.match(store, /order\("sequence", \{ ascending: true \}\)/);
  assert.match(sql, /unique \(work_session_id, sequence\)/);
});


test("work-session RPCs bind actor identity to the authenticated caller", async () => {
  const sql = await read("supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql");
  assert.match(sql, /p_created_by\s+is distinct from\s+auth\.uid\(\)/);
  assert.match(sql, /p_actor_user_id\s+is distinct from\s+auth\.uid\(\)/);
  assert.match(sql, /WORK_SESSION_ACTOR_MISMATCH/);
});
