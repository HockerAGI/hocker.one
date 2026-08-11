import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "../supabase/migrations/20260811023000_commands_read_role_alignment.sql";
const routePath = "../src/app/api/commands/route.ts";

test("legacy command queue read access is owner/admin/operator only", async () => {
  const sql = await readFile(new URL(migrationPath, import.meta.url), "utf8");

  assert.match(sql, /private\.is_project_operator_or_above\(p_project_id\s+text\)/i);
  assert.match(sql, /lower\(pm\.role\)\s+in\s*\(\s*'owner'\s*,\s*'admin'\s*,\s*'operator'\s*\)/i);
  assert.doesNotMatch(sql, /lower\(pm\.role\)[\s\S]*?'viewer'/i);
  assert.match(sql, /create\s+policy\s+"?commands_select_owner_admin_operator"?/i);
  assert.match(sql, /for\s+select\s+to\s+authenticated/i);
  assert.match(sql, /using\s*\(\s*private\.is_project_operator_or_above\(project_id\)\s*\)/i);
});

test("commands API GET matches the RLS read matrix while POST remains owner/admin", async () => {
  const route = await readFile(new URL(routePath, import.meta.url), "utf8");

  assert.match(
    route,
    /export\s+async\s+function\s+GET[\s\S]*?requireProjectRole\(project_id,\s*\["owner",\s*"admin",\s*"operator"\]\)/,
  );
  assert.doesNotMatch(
    route,
    /export\s+async\s+function\s+GET[\s\S]*?requireProjectRole\(project_id,\s*\[[^\]]*"viewer"/,
  );
  assert.match(
    route,
    /export\s+async\s+function\s+POST[\s\S]*?requireProjectRole\(project_id,\s*\["owner",\s*"admin"\]\)/,
  );
});
