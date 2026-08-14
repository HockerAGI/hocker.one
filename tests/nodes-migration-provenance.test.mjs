import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);

test("nodes access migrations match the versions recorded by Supabase", async () => {
  const files = await readdir(migrationsUrl);
  const readAlignment = files.filter((file) => file.startsWith("20260814103957_"));
  const legacyCleanup = files.filter((file) => file.startsWith("20260814104734_"));

  assert.deepEqual(
    readAlignment,
    ["20260814103957_nodes_read_role_alignment_20260814.sql"],
    "Git must contain exactly the Supabase-applied nodes migration version 20260814103957",
  );
  assert.deepEqual(
    legacyCleanup,
    ["20260814104734_nodes_schema_legacy_read_policy_cleanup_20260814.sql"],
    "Git must contain exactly the Supabase-applied legacy cleanup version 20260814104734",
  );
  assert.equal(
    files.includes("20260814095500_nodes_read_role_alignment.sql"),
    false,
    "the pre-apply read-alignment timestamp must not remain replayable",
  );
  assert.equal(
    files.includes("20260814104500_nodes_schema_legacy_read_policy_cleanup.sql"),
    false,
    "the pre-apply legacy-cleanup timestamp must not remain replayable",
  );
});
