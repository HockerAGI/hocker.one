import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);

test("current AGI hardening migration matches the version recorded by Supabase", async () => {
  const files = await readdir(migrationsUrl);
  const applied = files.filter((file) => file.startsWith("20260814102158_"));

  assert.deepEqual(
    applied,
    ["20260814102158_agi_internal_backend_only_contract_20260814.sql"],
    "Git must contain exactly the Supabase-applied version 20260814102158",
  );
  assert.equal(
    files.includes("20260814090000_agi_internal_backend_only_contract.sql"),
    false,
    "the pre-apply local timestamp must not remain as a replayable migration",
  );
});
