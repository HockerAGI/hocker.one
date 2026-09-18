import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const RECOVERED_REMOTE_VERSIONS = [
  "20260830151252",
  "20260901063237",
  "20260903182025",
];

const UNRESOLVED_REMOTE_VERSIONS = [
  "20260830153247",
  "20260902225257",
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

test("unresolved production migration versions remain explicitly quarantined", async () => {
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  const accidental = UNRESOLVED_REMOTE_VERSIONS.flatMap((version) =>
    names.filter((name) => name.startsWith(`${version}_`)),
  );

  const register = await readFile(
    new URL("../docs/operations/MIGRATION_PROVENANCE_2026-09-18.md", import.meta.url),
    "utf8",
  );

  assert.deepEqual(accidental, [], `unresolved production versions must not gain guessed SQL: ${accidental.join(", ")}`);
  for (const version of UNRESOLVED_REMOTE_VERSIONS) {
    assert.match(register, new RegExp(version));
  }
});


test("unavailable production versions are tracked by comment-only placeholders", async () => {
  const placeholders = [
    ["20260830153247_revoke_dead_public_agi_catalog_view_grants.sql", "20260830153247"],
    ["20260902225257_rollback_operational_event_fabric.sql", "20260902225257"],
  ];

  for (const [filename, version] of placeholders) {
    const source = await readFile(
      new URL(`../supabase/migrations/${filename}`, import.meta.url),
      "utf8",
    );
    assert.match(source, new RegExp(`Production ledger version: ${version}`));
    assert.match(source, /Historical SQL source was externally applied and is unavailable/i);
    assert.doesNotMatch(source, /\b(create|alter|drop|grant|revoke|insert|update|delete)\b/i);
  }
});
