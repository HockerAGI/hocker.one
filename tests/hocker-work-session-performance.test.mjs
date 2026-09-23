import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("work-session Performance Advisor remediation covers every reported FK", async () => {
  const sql = await read("supabase/migrations/20260923070000_hocker_work_session_performance_hardening.sql");

  for (const index of [
    "agi_tasks_parent_run_id_idx",
    "hocker_work_session_events_actor_user_id_idx",
    "hocker_work_sessions_action_id_idx",
    "hocker_work_sessions_created_by_idx",
    "hocker_work_sessions_run_id_idx",
    "hocker_work_sessions_task_id_idx",
  ]) {
    assert.match(sql, new RegExp(`create index if not exists ${index}`, "i"));
  }
});

test("work-session owner delete policy keeps the same authorization semantics with initplan-safe auth.uid()", async () => {
  const sql = await read("supabase/migrations/20260923070000_hocker_work_session_performance_hardening.sql");

  assert.match(sql, /drop policy if exists "hocker_work_sessions_delete_owner"/i);
  assert.match(sql, /create policy "hocker_work_sessions_delete_owner"/i);
  assert.match(sql, /lower\(pm\.role\) = 'owner'/i);
  assert.match(sql, /pm\.user_id = \(select auth\.uid\(\)\)/i);
});
