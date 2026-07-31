import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const migrationPath = "supabase/migrations/20260731_160000_verifiable_agi_workers.sql";

test("AGI tasks have correlation, evidence, idempotency and retry fields", async () => {
  const sql = await read(migrationPath);

  for (const field of [
    "request_id text",
    "input jsonb",
    "output jsonb",
    "evidence jsonb",
    "trace_id text",
    "parent_message_id text",
    "attempt_count integer",
    "max_attempts integer",
    "locked_at timestamptz",
    "lock_owner text",
    "idempotency_key text",
    "result_hash text",
  ]) {
    assert.match(sql, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(sql, /unique index if not exists agi_tasks_project_idempotency_uidx/i);
  assert.match(sql, /write_policy in \('read_only', 'draft_only', 'owner_gate'\)/);
});

test("worker claims are atomic and stale locks are recoverable", async () => {
  const sql = await read(migrationPath);

  assert.match(sql, /create or replace function public\.claim_next_agi_task/);
  assert.match(sql, /for update skip locked/i);
  assert.match(sql, /status = 'working'/);
  assert.match(sql, /attempt_count = task\.attempt_count \+ 1/);
  assert.match(sql, /create or replace function public\.heartbeat_agi_task/);
  assert.match(sql, /create or replace function public\.recover_stale_agi_tasks/);
});

test("only the locking worker can complete or fail a task", async () => {
  const sql = await read(migrationPath);

  assert.match(sql, /create or replace function public\.complete_agi_task/);
  assert.match(sql, /task\.lock_owner = p_worker_id/);
  assert.match(sql, /status = 'completed'/);
  assert.match(sql, /result_hash = nullif/);
  assert.match(sql, /create or replace function public\.fail_agi_task/);
  assert.match(sql, /when task\.attempt_count < task\.max_attempts then 'queued'/);
});

test("worker RPCs are server-only and use a fixed search path", async () => {
  const sql = await read(migrationPath);

  const functions = [
    "claim_next_agi_task",
    "heartbeat_agi_task",
    "complete_agi_task",
    "fail_agi_task",
    "recover_stale_agi_tasks",
  ];

  for (const name of functions) {
    assert.match(sql, new RegExp(`create or replace function public\\.${name}`));
  }

  assert.equal((sql.match(/security definer/g) ?? []).length, functions.length);
  assert.equal((sql.match(/set search_path = public/g) ?? []).length, functions.length);
  assert.equal((sql.match(/revoke all on function/g) ?? []).length, functions.length);
  assert.equal((sql.match(/grant execute on function/g) ?? []).length, functions.length);
  assert.doesNotMatch(sql, /grant execute .* to (public|anon|authenticated)/i);
});
