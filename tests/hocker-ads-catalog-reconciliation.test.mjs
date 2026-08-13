import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Hocker Ads catalog reflects the approved 8/8 product scope without claiming runtime readiness", async () => {
  const publicCatalog = await read("src/lib/public-catalog.ts");
  const operationsCatalog = await read("src/lib/operations-catalog.ts");
  const systemRegistry = await read("src/lib/hocker-system-registry-2c.ts");
  const commandCenter = await read("src/lib/hocker-command-center-registry.ts");
  const dashboard = await read("src/lib/hocker-dashboard.ts");
  const clientPortals = await read("src/lib/hocker-client-portals.ts");

  assert.match(publicCatalog, /Marketing, ventas y tecnología para hacer crecer tu negocio/);
  assert.match(publicCatalog, /NOVA \+ Nova Ads \+ Candy Ads \+ PRO IA \+ REVIA/);
  assert.match(publicCatalog, /Servicios Express/);
  assert.match(publicCatalog, /Especialistas IA/);

  assert.match(operationsCatalog, /"hocker-ads": "HockerAGI\/hocker\.ads"/);
  assert.match(operationsCatalog, /"hocker-ads": "development"/);

  assert.match(systemRegistry, /id: "hocker-ads"[\s\S]*?status: "building"/);
  assert.match(systemRegistry, /visibleName: "Marketing, ventas y tecnología"/);

  assert.match(commandCenter, /id: "hocker-ads"[\s\S]*?status: "building"/);
  assert.match(commandCenter, /label: "Marketing, ventas y tecnología"/);

  assert.match(dashboard, /key: "hocker-ads"[\s\S]*?status: "development"/);
  assert.match(dashboard, /Repositorio y diseño aprobados; runtime, tenant y deploy de Hocker Ads siguen pendientes/);

  assert.match(clientPortals, /portal_id: "hocker-ads-client"[\s\S]*?status: "planned"/);
  assert.match(clientPortals, /Aplicación cliente separada de Hocker ONE/);
  assert.match(clientPortals, /hidden_from_client: \["NOVA interna", "SYNTIA completa", "Supabase events", "governance", "global commands"\]/);
});

test("Hocker Ads descriptor reconciliation does not widen runtime security capabilities", async () => {
  const tenantRls = await read("src/lib/hocker-tenant-rls.ts");
  const capabilities = await read("src/lib/hocker-capabilities-contract.ts");

  assert.match(tenantRls, /real_client_sessions_enabled: false/);
  assert.match(capabilities, /key: "ads_campaigns"[\s\S]*?base_status: "pending"[\s\S]*?mode: "prepare_only"/);
  assert.match(capabilities, /can_execute_now: false/);
});
