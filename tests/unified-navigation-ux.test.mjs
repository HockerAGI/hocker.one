import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private navigation exposes three human workspaces", async () => {
  const source = await read("src/lib/hocker-navigation.ts");

  for (const id of ["nova", "pulso", "recursos"]) {
    assert.match(source, new RegExp(`\\n  \\{\\n    id: "${id}"`));
  }

  const sectionDeclarations = source.match(/\n  \{\n    id: "(?:nova|pulso|recursos)"/g) ?? [];
  assert.equal(sectionDeclarations.length, 3);
  assert.doesNotMatch(source, /id: "(?:inicio|operacion|ecosistema|control)"/);

  assert.match(source, /label: "NOVA"/);
  assert.match(source, /label: "Pulso"/);
  assert.match(source, /label: "Recursos"/);

  // Technical destinations stay available as deep links instead of persistent tabs.
  assert.match(source, /HockerSecondaryNavigation/);
  assert.match(source, /href: "\/workers"/);
  assert.match(source, /href: "\/owner\/actions"/);
  assert.match(source, /href: "\/owner\/evidence"/);
});

test("mobile dock keeps the three workspaces plus one More launcher", async () => {
  const source = await read("src/components/BottomDock.tsx");

  assert.match(source, /HOCKER_NAVIGATION\.map/);
  assert.match(source, /hko-bottom-dock-wrap lg:hidden/);
  assert.match(source, />Más</);
  assert.match(source, /triggerPalette/);
  assert.doesNotMatch(source, /Alertas|Buscar \(⌘K\)/);
});

test("private shell uses one visual backdrop and no duplicate persistent workspace bar", async () => {
  const source = await read("src/components/PrivateShell.tsx");

  assert.match(source, /<SignalBackdrop \/>/);
  assert.match(source, /<Sidebar \/>/);
  assert.match(source, /<Topbar \/>/);
  assert.match(source, /<BottomDock \/>/);
  assert.match(source, /<CommandPalette \/>/);
  assert.doesNotMatch(source, /HockerLiveBackground|HockerVfxLayer/);
  assert.doesNotMatch(source, /<WorkspaceBar \/>/);
});

test("NOVA becomes the private default after login", async () => {
  const appPage = await read("src/app/app/page.tsx");
  const loginRoute = await read("src/app/api/auth/password-login/route.ts");
  const authBox = await read("src/components/AuthBox.tsx");

  assert.match(appPage, /\.\/nova\/page/);
  assert.match(loginRoute, /redirectTo: "\/app\/nova"/);
  assert.match(authBox, /result\.redirectTo \|\| "\/app\/nova"/);
});

test("official brand assets are used according to available space", async () => {
  const sidebar = await read("src/components/Sidebar.tsx");
  const topbar = await read("src/components/Topbar.tsx");

  assert.match(sidebar, /\/brand\/hocker-one-logo\.png/);
  assert.match(sidebar, /width=\{192\}/);
  assert.match(topbar, /\/brand\/hocker-one-isotype\.png/);
});

test("command palette searches primary and secondary destinations", async () => {
  const palette = await read("src/components/CommandPalette.tsx");
  const navigation = await read("src/lib/hocker-navigation.ts");

  assert.match(palette, /if \(!normalized\) return BASE_ITEMS/);
  assert.match(palette, /SEARCHABLE_ITEMS/);
  assert.match(palette, /HOCKER_NAVIGATION\.flatMap/);
  assert.match(palette, /HOCKER_SECONDARY_NAVIGATION/);
  assert.match(palette, /role="dialog"/);
  assert.match(navigation, /id: "workers"[\s\S]*href: "\/workers"/);
});
