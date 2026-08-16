import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified AGI session schema is additive and fail-closed", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  assert.match(migration, /create table if not exists public\.agi_sessions/i);
  assert.match(migration, /create table if not exists public\.agi_messages/i);
  assert.match(migration, /enable row level security/i);
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
    "loadAgiConversationContext",
    "updateAgiSessionSummary",
  ]) {
    assert.match(source, new RegExp(`export async function ${symbol}`));
  }
  assert.match(source, /agi_sessions/);
  assert.match(source, /agi_messages/);
  assert.doesNotMatch(source, /provider\s*===\s*["']openai["'].*identity/s);
});

test("legacy NOVA history remains mapped and no rows are silently dropped", async () => {
  const migration = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  assert.match(migration, /backfill_legacy_nova_sessions/);
  assert.match(migration, /legacy_thread_id/);
  assert.match(migration, /legacy_source/);
  assert.match(migration, /nova_threads/);
  assert.match(migration, /nova_messages/);
  assert.match(migration, /unmapped_message_count/);
});
