import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);

test("nodes access migration matches the version recorded by Supabase", async () => {
  const files = await readdir(migrationsUrl);
  const applied = files.filter((file) => file.startsWith("20260814103957_"));

  assert.deepEqual(
    applied,
    ["20260814103957_nodes_read_role_alignment_20260814.sql"],
    "Git must contain exactly the Supabase-applied nodes migration version 20260814103957",
  );
  assert.equal(
    files.includes("20260814095500_nodes_read_role_alignment.sql"),
    false,
    "the pre-apply local timestamp must not remain as a replayable migration",
  );
});
