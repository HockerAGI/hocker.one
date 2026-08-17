import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

// Versions below are the affected timestamps observed in production
// supabase_migrations.schema_migrations and must exist exactly once in Git.
const REMOTE_VERSIONS_REQUIRING_GIT_PARITY = [
  "20260803001802",
  "20260803003021",
  "20260803003709",
  "20260803004413",
  "20260803010205",
  "20260804012300",
  "20260804012354",
  "20260804012436",
  "20260804012518",
  "20260804012554",
  "20260804012644",
  "20260804012737",
  "20260804012803",
  "20260804012856",
  "20260804012929",
  "20260804014747",
  "20260808215301",
  "20260808215327",
  "20260810182408",
  "20260810182511",
  "20260810184103",
  "20260810184116",
  "20260810184134",
  "20260810184240",
  "20260810184321",
  "20260810184341",
  "20260810184413",
  "20260810184437",
  "20260810184459",
  "20260810190312",
  "20260810191558",
  "20260810192259",
  "20260810202047",
  "20260811094745",
  "20260811100821",
  "20260811213752",
  "20260816215532",
  "20260816215830",
  "20260816215914",
  "20260816220010",
  "20260816220105",
  "20260816220145",
  "20260817003451",
];

test("Hocker One contains every affected remote Supabase migration timestamp exactly once", async () => {
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  const missing = [];
  const duplicated = [];
  for (const version of REMOTE_VERSIONS_REQUIRING_GIT_PARITY) {
    const matches = names.filter((name) => name.startsWith(`${version}_`));
    if (matches.length === 0) missing.push(version);
    if (matches.length > 1) duplicated.push({ version, matches });
  }

  assert.deepEqual(duplicated, [], `duplicate migration versions: ${JSON.stringify(duplicated)}`);
  assert.deepEqual(missing, [], `remote migration versions missing from Git: ${missing.join(", ")}`);
});
