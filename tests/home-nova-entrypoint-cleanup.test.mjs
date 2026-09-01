import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ownerPage = await readFile(new URL("../src/app/owner/page.tsx", import.meta.url), "utf8");

test("Home no longer mounts the immersive NOVA chat directly", () => {
  assert.doesNotMatch(ownerPage, /NovaRealtimeChatLazy/);
  assert.doesNotMatch(ownerPage, /hko-uni-chat/);
});

test("Home keeps a compact NOVA entrypoint tied to the operational state", () => {
  assert.match(ownerPage, /href=\"\/chat\"/);
  assert.match(ownerPage, /pendingCount/);
  assert.match(ownerPage, /novaService/);
});
