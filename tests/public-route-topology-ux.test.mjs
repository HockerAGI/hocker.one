import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function extractPublicIndexableRoutes(source) {
  const match = source.match(
    /HOCKER_PUBLIC_INDEXABLE_ROUTES\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  assert.ok(match, "Public indexable route declaration must exist");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

test("every declared public indexable route has a physical page", async () => {
  const topology = await read("src/lib/hocker-public-private-topology.ts");
  const routes = extractPublicIndexableRoutes(topology);

  assert.ok(routes.includes("/ecosistema"));
  assert.ok(routes.includes("/seguridad"));

  for (const route of routes) {
    const pagePath = route === "/"
      ? "src/app/page.tsx"
      : `src/app${route}/page.tsx`;

    await assert.doesNotReject(
      access(new URL(pagePath, root)),
      `Declared public route ${route} must have ${pagePath}`,
    );
  }
});

test("public marketing shell links every declared commercial destination", async () => {
  const source = await read("src/components/public-marketing/HockerPublicPage.tsx");

  for (const href of [
    "/empresa",
    "/servicios",
    "/soluciones",
    "/casos",
    "/ecosistema",
    "/seguridad",
    "/contacto",
  ]) {
    assert.match(source, new RegExp(`href: "${href.replaceAll("/", "\\/")}"`));
  }

  assert.match(source, /min-h-11/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /radial-gradient/);
  assert.doesNotMatch(source, /supabase|service_role|runtime\/actions/i);
});

test("framework not-found route never receives the private shell", async () => {
  const shell = await read("src/components/ShellFrame.tsx");
  const notFound = await read("src/app/not-found.tsx");

  assert.match(shell, /pathname === "\/_not-found"/);
  assert.match(shell, /isPublicRoute \|\| isFrameworkNotFound/);
  assert.match(notFound, /HockerPublicPage/);
  assert.doesNotMatch(notFound, /PrivateShell|WorkspaceBar|Owner Gate/);
});

test("missing public routes are implemented without private runtime state", async () => {
  for (const path of ["src/app/ecosistema/page.tsx", "src/app/seguridad/page.tsx"]) {
    const source = await read(path);
    assert.match(source, /HockerPublicPage/);
    assert.doesNotMatch(source, /createClient|service_role|runtime\/actions|requireProjectRole/i);
  }
});
