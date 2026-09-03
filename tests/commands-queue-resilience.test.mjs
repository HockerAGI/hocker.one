import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("commands queue guards browser Supabase configuration before opening Realtime", async () => {
  const source = await read("src/components/CommandsQueue.tsx");
  assert.match(source, /hasBrowserSupabaseEnv\(\)/);
  assert.match(source, /let channel: RealtimeChannel \| null = null/);
  assert.match(source, /try \{[\s\S]*channel = sb\.channel/);
  assert.match(source, /if \(channel\) void sb\.removeChannel\(channel\)/);
});

test("commands queue does not make Realtime publication a page-load dependency", async () => {
  const source = await read("src/components/CommandsQueue.tsx");
  assert.match(source, /channel = sb\.channel\(\`commands:\$\{projectId\}\`\)/);
  assert.match(source, /setError\(/);
  assert.match(source, /setLoading\(false\)/);
});
