import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

// Full production snapshot from supabase_migrations.schema_migrations.
// Supabase Branching clones Hocker One main, so every remote version must
// have exactly one local migration filename before Branching can reproduce it.
const REMOTE_PRODUCTION_VERSIONS = [
  "20260216",
  "20260226",
  "20260419",
  "20260421",
  "20260428",
  "20260502",
  "20260506",
  "20260516153413",
  "20260516185823",
  "20260516203048",
  "20260518",
  "20260519",
  "20260524",
  "20260613",
  "20260715",
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
  "20260731060000",
  "20260731173018",
  "20260731233428",
  "20260801000251",
  "20260801044102",
  "20260801050515",
  "20260801051257",
  "20260801052656",
  "20260801053314",
  "20260801195511",
  "20260802200541",
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
  "20260814024830",
  "20260814102158",
  "20260814103957",
  "20260814104734",
  "20260816215532",
  "20260816215830",
  "20260816215914",
  "20260816220010",
  "20260816220105",
  "20260816220145",
  "20260817003451",
];

test("Hocker One contains every production Supabase migration version exactly once", async () => {
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  const missing = [];
  const duplicated = [];
  for (const version of REMOTE_PRODUCTION_VERSIONS) {
    const matches = names.filter((name) => name.startsWith(`${version}_`));
    if (matches.length === 0) missing.push(version);
    if (matches.length > 1) duplicated.push({ version, matches });
  }

  assert.deepEqual(duplicated, [], `duplicate migration versions: ${JSON.stringify(duplicated)}`);
  assert.deepEqual(missing, [], `remote migration versions missing from Git: ${missing.join(", ")}`);
});
