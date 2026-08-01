import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = () =>
  readFile(
    new URL("../supabase/migrations/20260216_0000_core.sql", import.meta.url),
    "utf8",
  );

test("legacy role helpers preserve production parameter names", async () => {
  const sql = await migration();

  assert.doesNotMatch(
    sql,
    /is_project_(?:member|admin|operator)\(pid text\)/,
  );
  assert.equal((sql.match(/p_project_id text/g) ?? []).length, 3);
  assert.ok(
    (sql.match(/set search_path = public, pg_temp/g) ?? []).length >= 3,
  );
});

test("legacy commands migration recognizes the existing status constraint", async () => {
  const sql = await migration();

  assert.match(sql, /commands_status_check', 'commands_status_ck/);
  assert.match(sql, /conrelid = 'public\.commands'::regclass/);
});
