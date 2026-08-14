import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operations catalog exposes CHIDO Lab and CHIDO Games only as governed development services", async () => {
  const catalog = await read("src/lib/operations-catalog.ts");

  assert.match(catalog, /id: "chido-lab"[\s\S]*kind: "service"[\s\S]*status: "development"[\s\S]*repository: "HockerAGI\/chido\.lab"[\s\S]*approval: "owner_gate"/);
  assert.match(catalog, /id: "chido-games"[\s\S]*kind: "service"[\s\S]*status: "development"[\s\S]*repository: "HockerAGI\/chido\.games"[\s\S]*approval: "owner_gate"/);

  assert.match(catalog, /chido-lab[\s\S]*sin runtime productivo autorizado/i);
  assert.match(catalog, /chido-games[\s\S]*sin deployment productivo autorizado/i);
  assert.match(catalog, /chido-lab[\s\S]*no es RGS público[\s\S]*dinero real/i);
  assert.match(catalog, /chido-games[\s\S]*no autoriza partners, producción ni dinero real/i);
});
