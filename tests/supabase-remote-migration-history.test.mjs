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
  ["20260801044102", 1594],
  ["20260801050515", 3740],
  ["20260801051257", 184],
]);

const APPLIED_VERSION_ONLY = ["20260216"];
const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);

function migrationVersion(file) {
  return file.split("_", 1)[0];
}

test("every Supabase migration filename has a unique version", async () => {
  const files = (await readdir(migrationsUrl)).filter((file) => file.endsWith(".sql"));
  const seen = new Map();
  const duplicates = [];

  for (const file of files) {
    const version = migrationVersion(file);
    assert.match(version, /^\d{8}(?:\d{6})?$/, `Invalid migration version in ${file}`);
    const previous = seen.get(version);
    if (previous) duplicates.push(`${version}: ${previous}, ${file}`);
    else seen.set(version, file);
  }

  assert.deepEqual(duplicates, [], `Duplicate Supabase migration versions:\n${duplicates.join("\n")}`);
});

test("Git contains every migration version already applied remotely", async () => {
  const files = await readdir(migrationsUrl);

  for (const version of [...APPLIED_VERSION_ONLY, ...REMOTE_MIGRATIONS.keys()]) {
    const matches = files.filter((file) => file.startsWith(`${version}_`));
    assert.equal(
      matches.length,
      1,
      `Expected exactly one migration file for remote version ${version}, found: ${matches.join(", ") || "none"}`,
    );
  }
});

test("restored migration files match remote SQL length without truncation", async () => {
  const files = await readdir(migrationsUrl);
  const mismatches = [];

  for (const [version, expectedBytes] of REMOTE_MIGRATIONS) {
    const file = files.find((candidate) => candidate.startsWith(`${version}_`));
    assert.ok(file, `Missing migration for ${version}`);

    const sql = await readFile(new URL(file, migrationsUrl), "utf8");
    const rawBytes = Buffer.byteLength(sql, "utf8");
    const withoutOneTransportLf = sql.endsWith("\n")
      ? Buffer.byteLength(sql.slice(0, -1), "utf8")
      : rawBytes;

    if (rawBytes !== expectedBytes && withoutOneTransportLf !== expectedBytes) {
      mismatches.push(`${file}: raw=${rawBytes}, normalized=${withoutOneTransportLf}, expected=${expectedBytes}`);
    }
  }

  assert.deepEqual(mismatches, [], `Restored SQL byte mismatches:\n${mismatches.join("\n")}`);
});

test("safe audit replacement does not grant authenticated access", async () => {
  const sql = await readFile(
    new URL("20260801050515_safe_audit_index_cleanup.sql", migrationsUrl),
    "utf8",
  );

  assert.doesNotMatch(sql, /create\s+policy/i);
  assert.doesNotMatch(sql, /to\s+authenticated/i);
  assert.match(sql, /Service-only command execution logs/);
});

test("RLS lint replacement only fixes the trigger search path", async () => {
  const sql = await readFile(
    new URL("20260801051257_secure_set_updated_at_search_path.sql", migrationsUrl),
    "utf8",
  );

  assert.match(sql, /alter function public\.set_updated_at\(\) set search_path = public, pg_temp/i);
  assert.doesNotMatch(sql, /create\s+policy|drop\s+policy|drop\s+function/i);
});

test("known timestamp aliases and unsafe legacy replays are absent", async () => {
  const files = await readdir(migrationsUrl);
  const forbidden = [
    "20260216_0001_supply.sql",
    "20260612_103000_hocker_core_schema.sql",
    "20260612_103000_audit_chain_signatures.sql",
    "20260620_000000_consolidated_security_hotfixes.sql",
    "20260620_000001_universal_rls_lockdown.sql",
    "20260701_000000_supabase_audit_improvements.sql",
    "20260714_033000_security_rls_lint_fixes.sql",
    "20260730221800_move_admin_helper_to_private_schema.sql",
    "20260731_160000_verifiable_agi_workers.sql",
    "20260731234000_jurix_compliance_events.sql",
    "20260731035500_restrict_hocker_dashboard_snapshot.sql",
  ];

  for (const file of forbidden) {
    assert.equal(files.includes(file), false, `${file} must not be replayed.`);
  }
});
