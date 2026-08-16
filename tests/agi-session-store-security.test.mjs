import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified AGI session store is deny-by-default and service_role is least-privilege", async () => {
  const base = await read("supabase/migrations/20260816073000_unified_agi_sessions.sql");
  const hardening = await read("supabase/migrations/20260816073700_unified_agi_sessions_service_role_least_privilege.sql");

  assert.match(base, /alter table public\.agi_sessions enable row level security/i);
  assert.match(base, /alter table public\.agi_messages enable row level security/i);
  assert.match(base, /agi_sessions_deny_direct_access/i);
  assert.match(base, /agi_messages_deny_direct_access/i);
  assert.match(base, /using \(false\)/i);
  assert.match(base, /with check \(false\)/i);
  assert.match(base, /revoke all on function public\.ensure_agi_session/i);
  assert.match(base, /revoke all on function public\.append_agi_message/i);
  assert.match(base, /revoke all on function public\.sync_agi_turn_to_legacy_nova/i);

  for (const table of ["agi_sessions", "agi_messages"]) {
    assert.match(hardening, new RegExp(`revoke all on table public\\.${table} from service_role`, "i"));
    assert.match(hardening, new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`, "i"));
  }

  assert.doesNotMatch(hardening, /grant\s+all/i);
  assert.doesNotMatch(hardening, /\btruncate\b[^\n]*to\s+service_role/i);
  assert.doesNotMatch(hardening, /\breferences\b[^\n]*to\s+service_role/i);
  assert.doesNotMatch(hardening, /\btrigger\b[^\n]*to\s+service_role/i);
});
