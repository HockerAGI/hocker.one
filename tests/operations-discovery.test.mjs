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

test("global discovery is reachable from navigation and command search", async () => {
  const sidebar = await read("src/components/Sidebar.tsx");
  const palette = await read("src/components/CommandPalette.tsx");
  const catalogPage = await read("src/app/catalog/page.tsx");

  assert.match(sidebar, /href: "\/catalog"/);
  assert.match(palette, /OPERATIONS_CATALOG/);
  assert.match(palette, /repositorio o función/);
  assert.match(catalogPage, /OperationsDiscovery/);
});

test("tools page shows live MCP providers and preserves Owner Gate", async () => {
  const integrations = await read("src/app/integrations/page.tsx");

  assert.match(integrations, /getMcpRegistry/);
  assert.match(integrations, /isReadOnlyMcpTool/);
  assert.match(integrations, /Requiere aprobación/);
  assert.match(integrations, /Pedir acción a NOVA/);
  assert.match(integrations, /\/commands/);
});
