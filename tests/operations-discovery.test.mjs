import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operations catalog separates verified runtime from roadmap", async () => {
  const catalog = await read("src/lib/operations-catalog.ts");

  assert.match(catalog, /id: "hocker-one"[\s\S]*status: "operational"/);
  assert.match(catalog, /id: "nova-agi"[\s\S]*Servicio agentic verificable/);
  assert.match(catalog, /Concepto documentado sin aplicación operativa verificada/);
  assert.match(catalog, /trabajador independiente verificable todavía en desarrollo/);
  assert.match(catalog, /https:\/\/hockeragi\.vercel\.app/);
  assert.doesNotMatch(catalog, /status: "conscious"/i);
});

test("global discovery is reachable from shared navigation and searches canonical plus operational destinations", async () => {
  const navigation = await read("src/lib/hocker-navigation.ts");
  const sidebar = await read("src/components/Sidebar.tsx");
  const palette = await read("src/components/CommandPalette.tsx");
  const catalogPage = await read("src/app/catalog/page.tsx");

  assert.match(navigation, /href: "\/catalog"/);
  assert.match(sidebar, /HOCKER_NAVIGATION/);
  assert.match(palette, /HOCKER_NAVIGATION/);
  assert.match(palette, /HOCKER_SECONDARY_NAVIGATION/);
  assert.match(palette, /OPERATIONS_CATALOG/);
  assert.match(palette, /SEARCHABLE_ITEMS/);
  assert.match(palette, /Buscar en Hocker One/);
  assert.match(catalogPage, /OperationsDiscovery/);
  assert.match(catalogPage, /buildVerifiedOperationsCatalog/);
});

test("tools page shows MCP providers and preserves Owner Gate", async () => {
  const integrations = await read("src/app/integrations/page.tsx");

  assert.match(integrations, /getMcpRegistry/);
  assert.match(integrations, /isReadOnlyMcpTool/);
  assert.match(integrations, /Requiere aprobación/);
  assert.match(integrations, /Pedir acción a NOVA/);
  assert.match(integrations, /\/commands/);
});

test("ecosystem map separates profiles, current signals and historical evidence", async () => {
  const map = await read("src/components/map/EcosystemVfxNetwork.tsx");

  assert.match(map, /getHockerOperationalSnapshot/);
  assert.match(map, /perfiles documentados, componentes existentes, señales recientes/);
  assert.match(map, /Estado individual basado en evidencia/);
  assert.match(map, /heartbeat ≤ 5 min/);
  assert.doesNotMatch(map, /Mapa vivo/);
  assert.doesNotMatch(map, /NOVA coordina el ecosistema/);
  assert.doesNotMatch(map, />16 AGIs</);
});
