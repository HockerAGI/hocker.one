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


test("Owner approvals resolve to a real gated page, not a redirect or placeholder", async () => {
  const [redirects, page, tasks] = await Promise.all([
    read("next.config.ts"),
    read("src/app/owner/actions/page.tsx"),
    read("src/app/commands/page.tsx"),
  ]);
  assert.doesNotMatch(redirects, /source: "\/owner\/actions", destination: "\/commands"/);
  assert.match(page, /requireOwnerAal2Page\("\/owner\/actions"/);
  assert.match(page, /<OwnerApprovalCenter projectId=\{projectId\}/);
  assert.match(page, /robots: \{ index: false/);
  assert.doesNotMatch(page, /Aquí irá el listado de acciones|OwnerShell/);
  assert.match(tasks, /href="\/owner\/actions"/);
});

test("Context Bridge is discoverable in More and on mobile without weakening MFA", async () => {
  const [navigation, shell, context, palette] = await Promise.all([
    read("src/lib/hocker-navigation.ts"),
    read("src/components/PrivateShell.tsx"),
    read("src/app/owner/context-bridge/page.tsx"),
    read("src/components/CommandPalette.tsx"),
  ]);
  assert.match(navigation, /id: "context-bridge", href: "\/owner\/context-bridge", label: "Continuidad"/);
  assert.match(navigation, /matchPrefixes: \["\/owner\/evidence", "\/owner\/context-bridge"/);
  assert.match(shell, /<ContextNav \/>/);
  assert.match(shell, /showMobileContextNav/);
  assert.match(context, /requireOwnerAal2Page\("\/owner\/context-bridge"\)/);
  assert.match(context, /legacyActiveWithoutApproval/);
  assert.match(context, /no tiene un approval_id asociado/);
  assert.match(palette, /HOCKER_SECONDARY_NAVIGATION/);
});

test("official verified repository assets are used as wordmark and isotype", async () => {
  const [sidebar, topbar, home, manifest, logo, icon] = await Promise.all([
    read("src/components/Sidebar.tsx"),
    read("src/components/Topbar.tsx"),
    read("src/app/owner/page.tsx"),
    read("public/ecosystem/asset-map.json").then(JSON.parse),
    readFile(new URL("../public/ecosystem/apps/hocker-one/logo.png", import.meta.url)),
    readFile(new URL("../public/ecosystem/apps/hocker-one/icon.png", import.meta.url)),
  ]);
  assert.match(sidebar, /src="\/ecosystem\/apps\/hocker-one\/logo\.png"/);
  assert.match(topbar, /src="\/ecosystem\/apps\/hocker-one\/icon\.png"/);
  assert.match(home, /<h1 className="hko-uni-hero-title">Inicio<\/h1>/);
  assert.doesNotMatch(home, /src="\/ecosystem\/apps\/hocker-one\/(icon|logo)\.png"/);
  assert.doesNotMatch(sidebar, /src="\/brand\/hocker-one-logo\.png"/);
  assert.equal(manifest["hocker-one"].logo.dest, "ecosystem/apps/hocker-one/logo.png");
  assert.equal(manifest["hocker-one"].icon.dest, "ecosystem/apps/hocker-one/icon.png");
  const pngSignature = Buffer.from([137,80,78,71,13,10,26,10]);
  assert.ok(logo.subarray(0,8).equals(pngSignature), "wordmark must be original PNG");
  assert.ok(icon.subarray(0,8).equals(pngSignature), "isotype must be original PNG");
});

test("overview and topbar never approve sensitive actions without full Owner context", async () => {
  const [topbar, homeApprovals, approvalCenter] = await Promise.all([
    read("src/components/Topbar.tsx"),
    read("src/components/owner/OwnerUnifiedApprovals.tsx"),
    read("src/components/owner/OwnerApprovalCenter.tsx"),
  ]);
  assert.doesNotMatch(topbar, /handleDecision|decision: "approve"|decision: "reject"/);
  assert.doesNotMatch(homeApprovals, /api\/agi\/runtime\/actions\/decision|function mutate/);
  assert.match(homeApprovals, /href="\/owner\/actions"/);
  assert.match(homeApprovals, /Sin verificar/);
  assert.match(approvalCenter, /\/api\/agi\/runtime\/actions\/decision/);
});


test("pending approval pagination does not hide older Owner actions", async () => {
  const [center, route, queue] = await Promise.all([
    read("src/components/owner/OwnerApprovalCenter.tsx"),
    read("src/app/api/agi/runtime/actions/route.ts"),
    read("src/lib/agi-action-execution.ts"),
  ]);
  // A 20-row recent-history snapshot must never be the only way to discover
  // a pending decision, since >20 completed actions can be newer.
  assert.match(center, /params\.set\("status", view\)/);
  assert.match(center, /"needs_approval" \| "approved" \| "history"/);
  assert.match(center, /offset: String\(page \* PAGE_SIZE\)/);
  assert.match(center, /setPage\(\(value\) => value \+ 1\)/);
  assert.match(center, /href="\/owner\/actions"|Centro de aprobación AGI/);
  assert.match(route, /const offset = Number\(query\.get\("offset"\) \|\| 0\)/);
  assert.match(route, /Number\.isSafeInteger\(offset\)/);
  assert.match(route, /tool_key: toolKey, limit, offset/);
  assert.match(queue, /\.range\(offset, offset \+ limit - 1\)/);
  assert.match(queue, /\.order\("id", \{ ascending: false \}\)/);
});


test("Owner approval mobile design keeps review visible above excessive chrome", async () => {
  const [page, css, dock, navigation] = await Promise.all([
    read("src/app/owner/actions/page.tsx"),
    read("src/app/owner/actions/owner-actions-mobile.css"),
    read("src/components/BottomDock.tsx"),
    read("src/lib/hocker-navigation.ts"),
  ]);

  assert.match(page, /className="hko-owner-actions-page"/);
  assert.match(page, /<details className="hko-owner-safety/);
  assert.match(page, /requireOwnerAal2Page\("\/owner\/actions"/);
  assert.match(page, /<OwnerApprovalCenter projectId=\{projectId\}/);
  assert.doesNotMatch(page, /<OwnerShell|Aquí irá el listado de acciones/);

  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.hko-owner-actions-page \.hko-approval-metrics/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /min-height: 44px/);
  assert.doesNotMatch(css, /display: none;[\s\S]*?\.hko-approval-list\s*\{/);

  assert.match(navigation, /id: "ecosistema", href: "\/apps", label: "Ecosistema", shortLabel: "Apps"/);
  assert.match(dock, /aria-label=\{item.label\}/);
});
