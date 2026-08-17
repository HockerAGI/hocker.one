import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const TABLES = ["compliance_events", "game_history", "wager_progress_ledger"];

test("backend-only tables express client deny intent without opening new grants", async () => {
  const sql = await read("supabase/migrations/20260817013714_backend_only_explicit_deny_policies_20260817.sql");

  for (const table of TABLES) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`${table}_deny_client_access`, "i"));
  }

  assert.match(sql, /to anon, authenticated\s+using \(false\)\s+with check \(false\)/i);
  assert.doesNotMatch(sql, /grant\s+/i);
  assert.doesNotMatch(sql, /revoke\s+.*service_role/i);
  assert.doesNotMatch(sql, /drop\s+table/i);
});
