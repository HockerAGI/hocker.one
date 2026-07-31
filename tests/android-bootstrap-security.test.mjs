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
