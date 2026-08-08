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

test("offline fallback is static and contains no authentication form or private data placeholders", async () => {
  const offline = await read("public/offline.html");

  assert.match(offline, /Hocker ONE/i);
  assert.match(offline, /sin conexi[oó]n|offline/i);
  assert.doesNotMatch(offline, /<form\b/i);
  assert.doesNotMatch(offline, /<input\b/i);
  assert.doesNotMatch(offline, /token|secret|api[_-]?key|password/i);
});

test("Android verification records the exact bundletool artifact hash", async () => {
  const script = await read(".github/scripts/android-build-verify.sh");

  assert.match(script, /BUNDLETOOL-SHA256\.txt/);
  assert.match(script, /sha256sum\s+["']?\$bundletool/);
});
