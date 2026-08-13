import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Hocker Ads control-plane descriptors reflect the approved product scope without claiming runtime readiness", async () => {
  const operationsCatalog = await read("src/lib/operations-catalog.ts");
  const systemRegistry = await read("src/lib/hocker-system-registry-2c.ts");
  const clientPortals = await read("src/lib/hocker-client-portals.ts");

  assert.match(operationsCatalog, /"hocker-ads": "HockerAGI\/hocker\.ads"/);
  assert.match(operationsCatalog, /"hocker-ads": "development"/);
  assert.match(operationsCatalog, /Marketing, ventas y tecnología para hacer crecer tu negocio/);
  assert.match(operationsCatalog, /Servicios Express/);
  assert.match(operationsCatalog, /Especialistas IA/);
  assert.match(operationsCatalog, /NOVA/);
  assert.match(operationsCatalog, /REVIA/);

  assert.match(systemRegistry, /id: "hocker-ads"[\s\S]*?status: "building"/);
  assert.match(systemRegistry, /visibleName: "Marketing, ventas y tecnología"/);
  assert.match(systemRegistry, /NOVA \+ Nova Ads \+ Candy Ads \+ PRO IA \+ REVIA/);

  assert.match(clientPortals, /portal_id: "hocker-ads-client"[\s\S]*?status: "planned"/);
  assert.match(clientPortals, /modules: \["home", "services", "projects", "advertising", "sales", "specialists", "business"\]/);
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
