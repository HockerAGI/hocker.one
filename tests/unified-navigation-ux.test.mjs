import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private navigation exposes exactly five persistent domains", async () => {
  const source = await read("src/lib/hocker-navigation.ts");

  for (const id of ["inicio", "operacion", "nova", "ecosistema", "control"]) {
    assert.match(source, new RegExp(`id: "${id}"`));
  }

  const sectionDeclarations = source.match(/id: "(?:inicio|operacion|nova|ecosistema|control)"/g) ?? [];
  assert.equal(sectionDeclarations.length, 5);
  assert.match(source, /id: "workers"/);
  assert.match(source, /href: "\/owner\/actions"/);
  assert.match(source, /href: "\/owner\/evidence"/);
});

test("mobile dock uses the five domains and remains visible below desktop", async () => {
  const source = await read("src/components/BottomDock.tsx");

  assert.match(source, /HOCKER_NAVIGATION\.map/);
  assert.match(source, /hko-bottom-dock-wrap lg:hidden/);
  assert.doesNotMatch(source, /data-hocker-bottom-dock/);
  assert.doesNotMatch(source, /Alertas|Buscar \(⌘K\)/);
});

test("private shell includes contextual navigation before page content", async () => {
  const source = await read("src/components/PrivateShell.tsx");

  assert.match(source, /import ContextNav/);
  assert.match(source, /<ContextNav \/>/);
  assert.match(source, /pt-\[76px\]/);
});

test("page layouts use a cinematic header without wrapping the whole page in one surface", async () => {
  const layout = await read("src/components/system/layout/PageLayout.tsx");
  const legacyHeader = await read("src/components/ui-hocker/HockerPageHeader.tsx");

  assert.doesNotMatch(layout, /<Surface/);
  assert.match(layout, /radial-gradient\(circle_at_top_left/);
  assert.match(legacyHeader, /radial-gradient\(circle_at_top_left/);
});

test("command palette starts with curated navigation and searches the full catalog", async () => {
  const source = await read("src/components/CommandPalette.tsx");

  assert.match(source, /if \(!normalized\) return BASE_ITEMS/);
  assert.match(source, /SEARCHABLE_ITEMS/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /id: "workers"|nav-workers/);
});
