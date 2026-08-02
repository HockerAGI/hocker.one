import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function extractRouteArray(source, constantName) {
  const match = source.match(
    new RegExp(`${constantName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`),
  );
  assert.ok(match, `${constantName} declaration must exist`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

test("Hocker ONE has no duplicate corporate indexable routes", async () => {
  const topology = await read("src/lib/hocker-public-private-topology.ts");
  const sitemap = await read("src/app/sitemap.ts");
  const robots = await read("src/app/robots.ts");
  const routes = extractRouteArray(topology, "HOCKER_PUBLIC_INDEXABLE_ROUTES");

  assert.deepEqual(routes, []);
  assert.match(topology, /HockerAGI\/hocker\.agi/);
  assert.match(topology, /configured_is_not_connected: true/);
  assert.match(sitemap, /return \[\]/);
  assert.match(robots, /disallow: "\/"/);
});

test("Hocker ONE root enters control and corporate destinations use the official website", async () => {
  const config = await read("next.config.ts");

  assert.match(config, /source: "\/", destination: "\/owner", permanent: false/);
  assert.match(config, /https:\/\/hockeragi\.vercel\.app/);
  for (const route of ["/one", "/empresa", "/servicios", "/ecosistema", "/soluciones", "/casos", "/seguridad", "/contacto"]) {
    assert.match(config, new RegExp(`source: "${route.replaceAll("/", "\\/")}"`));
  }
});

test("legacy private interfaces redirect to canonical evidence-backed pages", async () => {
  const config = await read("next.config.ts");
  const aliases = [
    ["/app", "/owner"],
    ["/app/nova", "/chat"],
    ["/app/actividad", "/live"],
    ["/app/pendientes", "/commands"],
    ["/app/ecosistema", "/apps"],
    ["/app/ajustes", "/governance"],
    ["/owner/apps", "/apps"],
    ["/owner/agis", "/agis"],
    ["/owner/ecosystem", "/map"],
    ["/owner/command-center", "/owner"],
    ["/system", "/status"],
    ["/mobile", "/owner"],
  ];

  for (const [source, destination] of aliases) {
    const escapedSource = source.replaceAll("/", "\\/");
    const escapedDestination = destination.replaceAll("/", "\\/");
    assert.match(config, new RegExp(`source: "${escapedSource}", destination: "${escapedDestination}"`));
  }
});

test("private discovery and worker consoles remain noindex", async () => {
  const topology = await read("src/lib/hocker-public-private-topology.ts");
  const privateRoutes = extractRouteArray(topology, "HOCKER_PRIVATE_ROUTES");

  assert.ok(privateRoutes.includes("/catalog"));
  assert.ok(privateRoutes.includes("/workers"));
  assert.ok(privateRoutes.includes("/apps"));
  assert.ok(privateRoutes.includes("/agis"));
  assert.match(topology, /X-Robots-Tag/);
  assert.match(topology, /noindex, nofollow, noarchive/);
});

test("apps and AGIs pages are operational inventories, not marketing pages", async () => {
  const apps = await read("src/app/apps/page.tsx");
  const agis = await read("src/app/agis/page.tsx");

  assert.match(apps, /getHockerOperationalSnapshot/);
  assert.match(apps, /Los conceptos documentados no se presentan como productos activos/);
  assert.doesNotMatch(apps, /PUBLIC_APPS|Solicitar implementación|Productos para acelerar tu negocio/);

  assert.match(agis, /Worker verificado/);
  assert.match(agis, /Un perfil documentado no equivale a un worker activo/);
  assert.doesNotMatch(agis, /NovaCorePanel/);
});

test("NOVA status requires a verified health check", async () => {
  const owner = await read("src/app/owner/page.tsx");
  const chat = await read("src/components/NovaRealtimeChat.tsx");
  const runtimeRoute = await read("src/app/api/agi/runtime/summary/route.ts");
  const verifiedRuntime = await read("src/lib/verified-agi-runtime.ts");

  assert.doesNotMatch(owner, />NOVA activa</);
  assert.doesNotMatch(owner, />En vivo</);
  assert.match(owner, /novaService\.status/);

  assert.match(chat, /service_status\?\.nova/);
  assert.match(chat, /verificadas ·/);
  assert.doesNotMatch(chat, /NOVA respondió sin texto visible/);

  assert.match(runtimeRoute, /getVerifiedAgiRuntimeSummary/);
  assert.match(verifiedRuntime, /status === "online"/);
  assert.match(verifiedRuntime, /status === "connected"/);
  assert.match(verifiedRuntime, /status === "configured"/);
});

test("map, Chido, Supply and memory use evidence instead of static live claims", async () => {
  const map = await read("src/components/map/EcosystemVfxNetwork.tsx");
  const pulse = await read("src/components/map/MapLivePulse.tsx");
  const chido = await read("src/app/chido/page.tsx");
  const supply = await read("src/app/supply/page.tsx");
  const memory = await read("src/app/memory/page.tsx");

  assert.match(map, /getHockerOperationalSnapshot/);
  assert.doesNotMatch(map, /Mapa vivo|NOVA coordina el ecosistema/);
  assert.match(pulse, /Registros persistidos/);
  assert.doesNotMatch(pulse, /Pulso real|Errores prevenidos/);

  assert.match(chido, /getHockerOperationalSnapshot/);
  assert.doesNotMatch(chido, />Operativo<|>Activa</);
  assert.match(chido, /statusLabel\(status\)/);

  assert.match(supply, /supply_products/);
  assert.match(supply, /supply_orders/);
  assert.doesNotMatch(supply, /value: "En vivo"|value: "Activo"|value: "Listo"/);

  assert.match(memory, /eventos almacenados en Supabase/);
  assert.doesNotMatch(memory, /SYNTIA está activa/);
});

test("framework not-found route never receives the private shell", async () => {
  const shell = await read("src/components/ShellFrame.tsx");
  const notFound = await read("src/app/not-found.tsx");

  assert.match(shell, /pathname === "\/_not-found"/);
  assert.match(shell, /isPublicRoute \|\| isFrameworkNotFound/);
  assert.match(notFound, /HockerPublicPage/);
  assert.doesNotMatch(notFound, /PrivateShell|WorkspaceBar|Owner Gate/);
});
