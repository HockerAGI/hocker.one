import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Vercel functions execute near the Supabase us-west-1 data source", async () => {
  const config = JSON.parse(await read("vercel.json"));

  assert.deepEqual(config.regions, ["sfo1"]);
});
