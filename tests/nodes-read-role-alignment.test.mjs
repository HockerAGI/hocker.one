import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "../supabase/migrations/20260814103957_nodes_read_role_alignment_20260814.sql";
const rolesPath = "../src/lib/hocker-roles.ts";
const panelPath = "../src/components/NodesPanel.tsx";

test("nodes read policy permits authenticated project members without widening writes", async () => {
  const sql = await readFile(new URL(migrationPath, import.meta.url), "utf8");

  assert.match(sql, /drop\s+policy\s+if\s+exists\s+"?nodes_select_member"?/i);
  assert.match(sql, /drop\s+policy\s+if\s+exists\s+"?nodes_select_project_member"?/i);
  assert.match(sql, /create\s+policy\s+"?nodes_select_member"?/i);
  assert.match(sql, /for\s+select\s+to\s+authenticated/i);
  assert.match(sql, /using\s*\(\s*public\.is_project_member\(project_id\)\s*\)/i);
  assert.doesNotMatch(sql, /for\s+(insert|update|delete)/i);
  assert.doesNotMatch(sql, /drop\s+policy\s+"?nodes_admin_write"?/i);
  assert.doesNotMatch(sql, /drop\s+policy\s+"?nodes_service_all"?/i);
});

test("Hocker role contract and browser consumer both require member-visible nodes", async () => {
  const roles = await readFile(new URL(rolesPath, import.meta.url), "utf8");
  const panel = await readFile(new URL(panelPath, import.meta.url), "utf8");

  assert.match(roles, /role:\s*"viewer"[\s\S]*?"nodes:view"/);
  assert.match(roles, /role:\s*"operator"[\s\S]*?\.\.\.VIEW_PERMISSIONS/);
  assert.match(panel, /createBrowserSupabase\(\)/);
  assert.match(panel, /\.from\("nodes"\)/);
  assert.match(panel, /\.eq\("project_id",\s*projectId\)/);
});
