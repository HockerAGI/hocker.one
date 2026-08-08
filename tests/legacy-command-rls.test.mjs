import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "../supabase/migrations/20260807_hocker_one_commands_owner_gate_hardening.sql";

test("legacy commands writes are restricted to owner/admin by migration", async () => {
  const sql = await readFile(new URL(migrationPath, import.meta.url), "utf8");

  assert.match(sql, /create\s+or\s+replace\s+function\s+private\.is_project_owner_or_admin/i);
  assert.match(sql, /is_project_owner_or_admin\(p_project_id\s+text\)/i);
  assert.doesNotMatch(sql, /is_project_owner_or_admin\(p_project_id\s+uuid\)/i);
  assert.match(sql, /pm\.project_id::text\s*=\s*p_project_id/i);
  assert.match(sql, /pm\.user_id::text\s*=\s*\(select\s+auth\.uid\(\)\)::text/i);
  assert.match(sql, /lower\(pm\.role\)\s+in\s*\(\s*'owner'\s*,\s*'admin'\s*\)/i);
  assert.doesNotMatch(sql, /lower\(pm\.role\)[\s\S]*?'operator'/i);
  assert.match(sql, /drop\s+policy\s+if\s+exists\s+"?commands_admin_write"?/i);
  assert.match(sql, /create\s+policy\s+"?commands_owner_admin_write"?/i);
  assert.match(sql, /private\.is_project_owner_or_admin\(project_id\)/i);
});
