import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const REMOTE_MIGRATIONS = new Map([
  ["20260729233340", 4615],
  ["20260729234038", 2815],
  ["20260730002428", 185],
  ["20260730002629", 891],
  ["20260730002659", 271],
  ["20260730214443", 17360],
  ["20260730214710", 6989],
  ["20260730221742", 456],
  ["20260731002454", 1818],
  ["20260731002643", 11054],
  ["20260731002947", 7208],
  ["20260731003804", 3397],
  ["20260731004136", 5855],
  ["20260731004534", 9795],
  ["20260731004831", 6810],
  ["20260731004909", 2028],
  ["20260731004951", 3279],
  ["20260731005107", 2949],
  ["20260731023730", 484],
  ["20260731031409", 100],
  ["20260731033126", 3133],
  ["20260731033216", 239],
  ["20260731034213", 456],
  ["20260731055911", 171],
  ["20260731173018", 8200],
  ["20260731233428", 1572],
  ["20260801000251", 415],
]);

const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);

test("Git contains every migration version already applied remotely", async () => {
  const files = await readdir(migrationsUrl);

  for (const version of REMOTE_MIGRATIONS.keys()) {
    const matches = files.filter((file) => file.startsWith(`${version}_`));
    assert.equal(
      matches.length,
      1,
      `Expected exactly one migration file for remote version ${version}, found: ${matches.join(", ") || "none"}`,
    );
  }
});

test("remote migration SQL was not truncated while restoring history", async () => {
  const files = await readdir(migrationsUrl);

  for (const [version, expectedBytes] of REMOTE_MIGRATIONS) {
    const file = files.find((candidate) => candidate.startsWith(`${version}_`));
    assert.ok(file, `Missing migration for ${version}`);

    const sql = await readFile(new URL(file, migrationsUrl), "utf8");
    assert.equal(
      Buffer.byteLength(sql.trimEnd(), "utf8"),
      expectedBytes,
      `${file} does not match the SQL byte length stored in supabase_migrations.schema_migrations`,
    );
  }
});

test("known timestamp aliases cannot reapply the same production change", async () => {
  const files = await readdir(migrationsUrl);
  const forbidden = [
    "20260731_160000_verifiable_agi_workers.sql",
    "20260731234000_jurix_compliance_events.sql",
    "20260731035500_restrict_hocker_dashboard_snapshot.sql",
  ];

  for (const file of forbidden) {
    assert.equal(files.includes(file), false, `${file} duplicates a remotely applied migration.`);
  }
});
