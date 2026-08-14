import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operations catalog exposes CHIDO Lab and CHIDO Games as non-production governed services", async () => {
  const catalog = await read("src/lib/operations-catalog.ts");

  assert.match(catalog, /id: "chido-lab"[\s\S]*repository: "HockerAGI\/chido\.lab"[\s\S]*approval: "owner_gate"/);
  assert.match(catalog, /id: "chido-games"[\s\S]*repository: "HockerAGI\/chido\.games"[\s\S]*approval: "owner_gate"/);
  assert.match(catalog, /id: "chido-lab"[\s\S]*status: "development"/);
  assert.match(catalog, /id: "chido-games"[\s\S]*status: "development"/);
});
