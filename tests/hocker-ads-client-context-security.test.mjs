import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const TABLES = [
  "client_context_profiles",
  "client_brand_context",
  "client_content_history",
  "client_campaign_history",
  "client_comment_insights",
];

test("Hocker Ads client-context tables remain service-only until tenant portal access is designed", async () => {
  const migration = await read(
    "supabase/migrations/20260814012000_hocker_ads_client_context_fail_closed.sql",
  );

  for (const table of TABLES) {
    assert.match(
      migration,
      new RegExp(`revoke\\s+all\\s+privileges\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s*anon,\\s*authenticated`, "i"),
      `${table} must be hidden from public/anon/authenticated`,
    );
    assert.match(
      migration,
      new RegExp(`grant\\s+select,\\s*insert,\\s*update,\\s*delete\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+service_role`, "i"),
      `${table} must remain available to service_role`,
    );
  }

  assert.doesNotMatch(migration, /drop\s+table|truncate\s+table|delete\s+from/i);
});
