import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const RECOVERED_REMOTE_VERSIONS = [
  "20260830151252",
  "20260830153247",
  "20260902225257",
  "20260901063237",
  "20260903182025",
  "20260918081119",
];

test("recovered production migrations are represented exactly once in Git", async () => {
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  const missing = [];
  const duplicated = [];

  for (const version of RECOVERED_REMOTE_VERSIONS) {
    const matches = names.filter((name) => name.startsWith(`${version}_`));
    if (matches.length === 0) missing.push(version);
    if (matches.length > 1) duplicated.push({ version, matches });
  }

  assert.deepEqual(duplicated, [], `duplicate recovered migration versions: ${JSON.stringify(duplicated)}`);
  assert.deepEqual(missing, [], `recovered production migrations missing from Git: ${missing.join(", ")}`);
});

test("previously unavailable production versions are linked to authoritative ledger sources", async () => {
  const files = [
    ["20260830153247_revoke_dead_public_agi_catalog_view_grants.sql", "20260830153247"],
    ["20260902225257_rollback_operational_event_fabric.sql", "20260902225257"],
  ];
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));
  const register = await readFile(
    new URL("../docs/operations/MIGRATION_PROVENANCE_2026-09-18.md", import.meta.url),
    "utf8",
  );
  for (const [filename, version] of files) {
    assert.ok(names.includes(filename), `missing production source for ${version}`);
    assert.match(register, new RegExp(version));
    assert.match(register, /supabase_migrations\.schema_migrations\.statements\[1\]/);
  }
  assert.doesNotMatch(register, /SOURCE UNAVAILABLE — placeholder only/);
});

test("recovered historical SQL retains fail-closed privilege and rollback intent", async () => {
  const revoke = await readFile(new URL(
    "../supabase/migrations/20260830153247_revoke_dead_public_agi_catalog_view_grants.sql", import.meta.url
  ), "utf8");
  const rollback = await readFile(new URL(
    "../supabase/migrations/20260902225257_rollback_operational_event_fabric.sql", import.meta.url
  ), "utf8");
  assert.match(revoke, /revoke select on table public\.agis_public_catalog from anon;/i);
  assert.match(revoke, /revoke select on table public\.agis_public_catalog from authenticated;/i);
  assert.match(rollback, /drop trigger if exists hocker_operational_event_action_queue/i);
  assert.match(rollback, /drop table if exists public\.hocker_operational_events cascade;/i);
});
