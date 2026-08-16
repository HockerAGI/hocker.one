import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("page metadata relies on the root Hocker ONE title template exactly once", async () => {
  const root = await read("src/app/layout.tsx");
  const login = await read("src/app/login/page.tsx");
  const chat = await read("src/app/chat/page.tsx");

  assert.match(root, /template:\s*"%s \| Hocker ONE"/);
  assert.match(login, /title:\s*"Login"/);
  assert.match(chat, /title:\s*"NOVA"/);
  assert.doesNotMatch(login, /title:\s*"[^"]*Hocker ONE/);
  assert.doesNotMatch(chat, /title:\s*"[^"]*Hocker ONE/);
});
