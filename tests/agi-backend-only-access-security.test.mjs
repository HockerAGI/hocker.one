import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const TABLES = [
  "agi_chat_messages",
  "agi_integration_checks",
  "agi_runtime_tokens",
  "compliance_events",
  "context_bridge_capabilities",
  "context_bridge_checkpoints",
  "context_bridge_coverage",
  "context_bridge_manifests",
  "context_bridge_sources",
  "owner_gate_approvals",
];

test("internal AGI, Context Bridge and Owner Gate tables keep an explicit backend-only grants contract", async () => {
  const migration = await read(
    "supabase/migrations/20260814090000_agi_internal_backend_only_contract.sql",
  );

  for (const table of TABLES) {
    assert.match(
      migration,
      new RegExp(`revoke\\s+all\\s+privileges\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s*anon,\\s*authenticated`, "i"),
      `${table} must be hidden from public/anon/authenticated`,
    );
    assert.match(
      migration,
      new RegExp(`grant\\s+all\\s+privileges\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+service_role`, "i"),
      `${table} must remain available to service_role`,
    );
  }

  // RLS-without-policy is intentionally retained for these backend-only tables.
  // Do not add no-op deny policies merely to silence Supabase Advisor INFO findings.
  assert.doesNotMatch(migration, /create\s+policy/i);
  assert.doesNotMatch(migration, /\b(drop\s+table|truncate\s+table|delete\s+from)\b/i);
  assert.doesNotMatch(migration, /\b(game_history|wager_progress_ledger|bets|balances|transactions)\b/i);
});
