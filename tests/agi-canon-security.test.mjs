import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGI canon validation is security-invoker and service-only", async () => {
  const migration = await read("supabase/migrations/20260810122000_agi_canon_validation_privilege_hardening.sql");

  assert.match(migration, /alter view public\.v_agi_canon_completeness[\s\S]*security_invoker\s*=\s*true/i);
  assert.match(migration, /revoke all on public\.v_agi_canon_completeness[\s\S]*public, anon, authenticated/i);
  assert.match(migration, /grant select on public\.v_agi_canon_completeness[\s\S]*service_role/i);
  assert.match(migration, /revoke all on function public\.validate_hocker_agi_canon\(\)[\s\S]*public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.validate_hocker_agi_canon\(\)[\s\S]*service_role/i);
});
