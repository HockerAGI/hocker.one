import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("queue orphan view matches the executable reconciliation definition", async () => {
  const source = await read(
    "supabase/migrations/20260904120000_align_queue_orphan_view_with_reconciler.sql",
  );

  assert.match(source, /q\.status\s*=\s*'executed'/i);
  assert.match(source, /r\.id\s+IS\s+NULL/i);
  assert.match(source, /a\.queue_id\s+IS\s+NULL/i);
  assert.doesNotMatch(source, /q\.status\s*<>\s*'executed'/i);
});
