import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Capacitor bootstrap has no third-party executable script", async () => {
  const html = await read("out/index.html");

  assert.match(html, /Content-Security-Policy/i);
  assert.match(html, /https:\/\/hockerone\.vercel\.app/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /myninja\.ai/i);
  assert.doesNotMatch(html, /http:\/\//i);
});

test("Android production shell disables backup and cleartext traffic", async () => {
  const manifest = await read("android/app/src/main/AndroidManifest.xml");

  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:fullBackupContent="false"/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.doesNotMatch(manifest, /android:allowBackup="true"/);
});

test("Android minSdk supports Capacitor service worker APIs", async () => {
  const variables = await read("android/variables.gradle");
  const match = variables.match(/minSdkVersion\s*=\s*(\d+)/);

  assert.ok(match, "minSdkVersion must remain explicit");
  assert.ok(Number(match[1]) >= 24, "Capacitor service worker support requires API 24+");
});

test("Android 2026 release baseline targets API 36", async () => {
  const variables = await read("android/variables.gradle");
  const compile = variables.match(/compileSdkVersion\s*=\s*(\d+)/);
  const target = variables.match(/targetSdkVersion\s*=\s*(\d+)/);

  assert.ok(compile, "compileSdkVersion must remain explicit");
  assert.ok(target, "targetSdkVersion must remain explicit");
  assert.ok(Number(compile[1]) >= 36, "2026 Play launch baseline requires compileSdk API 36+");
  assert.ok(Number(target[1]) >= 36, "2026 Play launch baseline requires targetSdk API 36+");
});
