import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("core command/node write policies do not overlap authenticated SELECT", async () => {
  const sql = await read("supabase/migrations/20260817004000_core_command_node_policy_reconciliation.sql");

  assert.match(sql, /drop policy if exists "commands_owner_admin_write" on public\.commands/i);
  assert.match(sql, /create policy "commands_owner_admin_insert"[\s\S]*for insert[\s\S]*private\.is_project_owner_or_admin\(project_id\)/i);
  assert.match(sql, /create policy "commands_owner_admin_update"[\s\S]*for update[\s\S]*private\.is_project_owner_or_admin\(project_id\)[\s\S]*with check \(private\.is_project_owner_or_admin\(project_id\)\)/i);
  assert.match(sql, /create policy "commands_owner_admin_delete"[\s\S]*for delete[\s\S]*private\.is_project_owner_or_admin\(project_id\)/i);

  assert.match(sql, /drop policy if exists "nodes_admin_write" on public\.nodes/i);
  assert.match(sql, /create policy "nodes_admin_insert"[\s\S]*for insert[\s\S]*private\.is_project_admin\(project_id\)/i);
  assert.match(sql, /create policy "nodes_admin_update"[\s\S]*for update[\s\S]*private\.is_project_admin\(project_id\)[\s\S]*with check \(private\.is_project_admin\(project_id\)\)/i);
  assert.match(sql, /create policy "nodes_admin_delete"[\s\S]*for delete[\s\S]*private\.is_project_admin\(project_id\)/i);

  assert.doesNotMatch(sql, /create policy[\s\S]*for all[\s\S]*to authenticated/i);
  assert.doesNotMatch(sql, /drop policy if exists "commands_select_owner_admin_operator"/i);
  assert.doesNotMatch(sql, /drop policy if exists "nodes_select_member"/i);
  assert.doesNotMatch(sql, /grant\s+/i);
  assert.doesNotMatch(sql, /revoke\s+/i);
});
