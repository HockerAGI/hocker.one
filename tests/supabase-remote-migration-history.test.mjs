import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

const REMOTE_VERSIONS = [
  "20260729233340",
  "20260729234038",
  "20260730002428",
  "20260730002629",
  "20260730002659",
  "20260730214443",
  "20260730214710",
  "20260730221742",
  "20260731002454",
  "20260731002643",
  "20260731002947",
  "20260731003804",
  "20260731004136",
  "20260731004534",
  "20260731004831",
  "20260731004909",
  "20260731004951",
  "20260731005107",
  "20260731023730",
  "20260731031409",
  "20260731033126",
  "20260731033216",
  "20260731034213",
  "20260731055911",
  "20260731173018",
  "20260731233428",
  "20260801000251",
];

test("Git contains every migration version already applied remotely", async () => {
  const files = await readdir(new URL("../supabase/migrations/", import.meta.url));

  for (const version of REMOTE_VERSIONS) {
    const matches = files.filter((file) => file.startsWith(`${version}_`));
    assert.equal(
      matches.length,
      1,
      `Expected exactly one migration file for remote version ${version}, found: ${matches.join(", ") || "none"}`,
    );
  }
});

test("known timestamp aliases cannot reapply the same production change", async () => {
  const files = await readdir(new URL("../supabase/migrations/", import.meta.url));
  const forbidden = [
    "20260731_160000_verifiable_agi_workers.sql",
    "20260731234000_jurix_compliance_events.sql",
    "20260731035500_restrict_hocker_dashboard_snapshot.sql",
  ];

  for (const file of forbidden) {
    assert.equal(files.includes(file), false, `${file} duplicates a remotely applied migration.`);
  }
});
