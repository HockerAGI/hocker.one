import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PWA has a stable identity without forcing portrait-only operation", async () => {
  const manifest = await read("src/app/manifest.ts");

  assert.match(manifest, /id:\s*["']\/app\/nova["']/);
  assert.match(manifest, /start_url:\s*["']\/app\/nova["']/);
  assert.doesNotMatch(manifest, /orientation:\s*["']portrait["']/);
});

test("service worker updates bypass HTTP cache and never caches private API data", async () => {
  const register = await read("src/components/PwaRegister.tsx");
  const worker = await read("public/sw.js");

  assert.match(register, /updateViaCache:\s*["']none["']/);
  assert.match(worker, /OFFLINE_URL\s*=\s*["']\/offline\.html["']/);
  assert.match(worker, /url\.pathname\.startsWith\(["']\/api\/["']\)/);
  assert.match(worker, /request\.mode\s*!==\s*["']navigate["']/);
  assert.doesNotMatch(worker, /cache\.put\s*\(/);
  assert.doesNotMatch(worker, /caches\.match\(request/);
});

test("PWA exposes a visible update lifecycle without interrupting Owner work", async () => {
  const register = await read("src/components/PwaRegister.tsx");
  const worker = await read("public/sw.js");

  assert.match(register, /hocker:pwa-update-available/);
  assert.match(register, /reg\.waiting/);
  assert.match(register, /updatefound/);
  assert.match(register, /statechange/);
  assert.match(register, /controllerchange/);
  assert.match(register, /Nueva versión disponible/);
  assert.match(register, /HOCKER_ACTIVATE_UPDATE/);
  assert.match(register, /label:\s*["']Activar["']/);
  assert.match(register, /label:\s*["']Recargar["']/);
  assert.doesNotMatch(register, /window\.location\.reload\s*\(/);

  const installBlock = worker.match(/self\.addEventListener\(["']install["'][\s\S]*?\n\}\);/)?.[0] ?? "";
  assert.ok(installBlock, "service worker must keep an install handler");
  assert.doesNotMatch(installBlock, /skipWaiting\s*\(/, "install must never force-activate a new worker");
  assert.match(worker, /self\.addEventListener\(["']message["']/);
  assert.match(worker, /HOCKER_ACTIVATE_UPDATE/);
  assert.match(worker, /self\.skipWaiting\s*\(\)/);
});

test("offline fallback is static and contains no authentication form or private data placeholders", async () => {
  const offline = await read("public/offline.html");

  assert.match(offline, /Hocker ONE/i);
  assert.match(offline, /sin conexi[oó]n|offline/i);
  assert.doesNotMatch(offline, /<form\b/i);
  assert.doesNotMatch(offline, /<input\b/i);
  assert.doesNotMatch(offline, /token|secret|api[_-]?key|password/i);
});

test("Android verifies the pinned bundletool artifact before executing it", async () => {
  const script = await read(".github/scripts/android-build-verify.sh");
  const expectedSha = "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29";

  assert.match(script, new RegExp(`BUNDLETOOL_SHA256:=?${expectedSha}`));
  assert.match(script, /BUNDLETOOL-SHA256\.txt/);
  assert.match(script, /sha256sum\s+["']?\$bundletool/);
  assert.match(script, /sha256sum\s+--check\s+--strict/);

  const verifyIndex = script.indexOf("sha256sum --check --strict");
  const executeIndex = script.indexOf('java -jar "$bundletool"');
  assert.ok(verifyIndex >= 0 && executeIndex >= 0 && verifyIndex < executeIndex,
    "bundletool checksum verification must happen before java executes the downloaded JAR");
});
