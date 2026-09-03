import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("commands queue reads through the authenticated commands API", async () => {
  const source = await read("src/components/CommandsQueue.tsx");
  assert.match(source, /fetch\(`\/api\/commands\?project_id=\$\{encodeURIComponent\(projectId\)\}`/);
  assert.match(source, /const rows = Array\.isArray\(data\.items\) \? data\.items : \[\]/);
  assert.match(source, /setError\(/);
});

test("commands queue does not depend on Supabase Realtime for page load", async () => {
  const source = await read("src/components/CommandsQueue.tsx");
  assert.doesNotMatch(source, /RealtimeChannel/);
  assert.doesNotMatch(source, /\.channel\(/);
  assert.match(source, /setInterval\(/);
});
