import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const migrationPath = "supabase/migrations/20260817023000_project_members_owner_admin_write_hardening.sql";

test("project membership writes require owner/admin and never operator", async () => {
  const sql = await read(migrationPath);

  for (const policy of [
    "project_members_insert_admin",
    "project_members_update_admin",
    "project_members_delete_admin",
  ]) {
    assert.match(sql, new RegExp(`create\\s+policy\\s+${policy}`, "i"));
  }

  const writePolicySql = sql
    .split(/create\s+policy\s+/i)
    .filter((block) => /^project_members_(insert|update|delete)_admin\b/i.test(block))
    .join("\n");

  assert.match(writePolicySql, /private\.is_project_owner_or_admin\(project_id\)/i);
  assert.doesNotMatch(writePolicySql, /private\.is_project_admin\(project_id\)/i);
});

test("hardening is policy-scoped and does not redefine global authorization helpers", async () => {
  const sql = await read(migrationPath);
  assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+private\.is_project_admin/i);
  assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+private\.is_project_owner_or_admin/i);
  assert.doesNotMatch(sql, /revoke\s+.*authenticated/i);
});
