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

test("corporate destinations redirect to the official website", async () => {
  const config = await read("next.config.ts");

  assert.match(config, /https:\/\/hockeragi\.vercel\.app/);
  for (const route of ["/", "/empresa", "/servicios", "/ecosistema", "/soluciones", "/casos", "/seguridad", "/contacto"]) {
    assert.match(config, new RegExp(`source: "${route.replaceAll("/", "\\/")}"`));
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

test("framework not-found route never receives the private shell", async () => {
  const shell = await read("src/components/ShellFrame.tsx");
  const notFound = await read("src/app/not-found.tsx");

  assert.match(shell, /pathname === "\/_not-found"/);
  assert.match(shell, /isPublicRoute \|\| isFrameworkNotFound/);
  assert.match(notFound, /HockerPublicPage/);
  assert.doesNotMatch(notFound, /PrivateShell|WorkspaceBar|Owner Gate/);
});
