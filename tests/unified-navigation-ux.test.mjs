import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private navigation exposes six simple destinations and preserves secondary routes", async () => {
  const source = await read("src/lib/hocker-navigation.ts");

  for (const label of ["Inicio", "NOVA", "Trabajo", "Ecosistema", "Operación", "Más"]) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }

  assert.match(source, /HOCKER_SECONDARY_NAVIGATION/);
  for (const href of ["/workers", "/owner/actions", "/owner/evidence", "/security", "/integrations", "/memory"]) {
    assert.match(source, new RegExp(`href: "${href.replaceAll("/", "\\/")}"`));
  }
});

test("mobile dock uses a compact registry with Más instead of forcing every desktop destination", async () => {
  const [source, navigation] = await Promise.all([
    read("src/components/BottomDock.tsx"),
    read("src/lib/hocker-navigation.ts"),
  ]);

  assert.match(source, /HOCKER_MOBILE_NAVIGATION/);
  assert.match(source, /HOCKER_MOBILE_NAVIGATION\.map/);
  assert.match(source, /hko-bottom-dock-wrap lg:hidden/);
  const mobileBlock = navigation.match(/export const HOCKER_MOBILE_NAVIGATION[\s\S]*?\];/)?.[0] ?? "";
  assert.match(mobileBlock, /label: "Más"/);
  assert.doesNotMatch(mobileBlock, /label: "Operación"/);
});

test("private shell removes permanent workspace noise and keeps one navigation layer per breakpoint", async () => {
  const source = await read("src/components/PrivateShell.tsx");

  assert.match(source, /<Sidebar \/>/);
  assert.match(source, /<Topbar \/>/);
  assert.match(source, /<BottomDock \/>/);
  assert.match(source, /<CommandPalette \/>/);
  assert.doesNotMatch(source, /WorkspaceBar/);
  assert.match(source, /hko-mobile-dock-reserve/);
});

test("desktop topbar does not duplicate the full product logo already owned by sidebar", async () => {
  const source = await read("src/components/Topbar.tsx");
  assert.doesNotMatch(source, /hocker-one-logo\.png/);
});

test("command palette searches primary and secondary destinations", async () => {
  const palette = await read("src/components/CommandPalette.tsx");

  assert.match(palette, /HOCKER_NAVIGATION/);
  assert.match(palette, /HOCKER_SECONDARY_NAVIGATION/);
  assert.match(palette, /role="dialog"/);
});
