import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = () =>
  readFile(
    new URL("../supabase/migrations/20260502_0003_hocker_core_hardening.sql", import.meta.url),
    "utf8",
  );

test("hardening audit seed uses production audit columns", async () => {
  const sql = await migration();
  const seed = sql.slice(sql.lastIndexOf("insert into public.audit_logs"));

  assert.match(seed, /project_id,\s*action,\s*context/i);
  assert.doesNotMatch(seed, /actor_type|target_type,\s*level,\s*message,\s*data/i);
});

test("hardening audit seed is idempotent without relying on a conflict target", async () => {
  const sql = await migration();
  const seed = sql.slice(sql.lastIndexOf("insert into public.audit_logs"));

  assert.match(seed, /where not exists/i);
  assert.match(seed, /existing\.context ->> 'migration'/i);
});
