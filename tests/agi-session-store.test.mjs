import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified AGI session schema is additive and fail-closed", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  assert.match(migration, /create table if not exists public\.agi_sessions/i);
  assert.match(migration, /create table if not exists public\.agi_messages/i);
  assert.match(migration, /alter table public\.agi_sessions enable row level security/i);
  assert.match(migration, /alter table public\.agi_messages enable row level security/i);
  assert.match(migration, /revoke all on table public\.agi_sessions from public, anon, authenticated/i);
  assert.match(migration, /revoke all on table public\.agi_messages from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /drop\s+table\s+.*nova_(threads|messages)/i);
  assert.doesNotMatch(migration, /alter\s+table\s+.*nova_(threads|messages)\s+rename/i);
});

test("session store exposes durable provider-independent contracts", async () => {
  const source = await read("src/lib/agi-session-store.ts");
  for (const symbol of [
    "ensureAgiSession",
    "appendAgiMessage",
    "syncAgiTurnToLegacyNova",
    "persistDedicatedNovaFallbackTurn",
    "loadAgiConversationContext",
    "updateAgiSessionSummary",
  ]) {
    assert.match(source, new RegExp(`export async function ${symbol}`));
  }
  assert.match(source, /agi_sessions/);
  assert.match(source, /agi_messages/);
  assert.doesNotMatch(source, /provider\s*===\s*["']openai["'].*identity/s);
});

test("new messages are idempotent by session message_key", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  const source = await read("src/lib/agi-session-store.ts");
  assert.match(migration, /message_key text/);
  assert.match(migration, /agi_messages_message_key_unique_idx/);
  assert.match(migration, /AGI_MESSAGE_IDEMPOTENCY_CONFLICT/);
  assert.match(source, /p_message_key: input\.message_key/);
});

test("legacy NOVA compatibility is post-turn, idempotent and observable", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  assert.match(migration, /legacy_sync_state text not null default 'not_applicable'/i);
  assert.match(migration, /sync_agi_turn_to_legacy_nova/);
  assert.match(migration, /mark_agi_legacy_sync_pending/);
  assert.match(migration, /meta->>'agi_message_id'/);
  assert.match(migration, /legacy_sync_state = 'synced'/);
  assert.match(migration, /legacy_sync_state = 'pending_reconcile'/);
});

test("legacy NOVA history backfills idempotently and reports unmapped rows", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  assert.match(migration, /backfill_legacy_nova_sessions/);
  assert.match(migration, /legacy_source/);
  assert.match(migration, /nova_threads/);
  assert.match(migration, /nova_messages/);
  assert.match(migration, /unmapped_message_count/);
  assert.match(migration, /on conflict \(legacy_source, legacy_id\).*do nothing/is);
});

test("dedicated fallback imports into the same global turn without duplicating usage", async () => {
  const source = await read("src/lib/agi-session-store.ts");
  assert.match(source, /message_key: `\$\{input\.request_trace_id\}:user`/);
  assert.match(source, /message_key: `\$\{input\.request_trace_id\}:assistant`/);
  assert.match(source, /source_provider/);
  assert.match(source, /source_model/);
  assert.match(source, /Do not pass provider\/model into appendAgiMessage here/);
  assert.match(source, /legacy_sync_state: "external_fallback"/);
});
