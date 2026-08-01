import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = () =>
  readFile(
    new URL("../supabase/migrations/20260428_0005_hocker_one_project_alignment.sql", import.meta.url),
    "utf8",
  );

test("project member alignment does not require a unique constraint", async () => {
  const sql = await migration();

  assert.doesNotMatch(sql, /on conflict \(project_id, user_id\)/i);
  assert.ok((sql.match(/not exists \(/gi) ?? []).length >= 2);
});

test("new-user trigger is fixed-path and not client executable", async () => {
  const sql = await migration();

  assert.match(sql, /set search_path = public, pg_temp/i);
  assert.match(
    sql,
    /revoke all on function public\.handle_new_user\(\) from public, anon, authenticated/i,
  );
});
