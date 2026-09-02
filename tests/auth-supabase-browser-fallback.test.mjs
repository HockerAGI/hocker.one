import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("browser Supabase client prefers the canonical public publishable key", async () => {
  const source = await read("src/lib/supabase-browser.ts");
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\s*\?\?/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\?\?/);
  assert.doesNotMatch(source, /process\.env\.SUPABASE_PUBLISHABLE_KEY\s*\?\?/);
  assert.doesNotMatch(source, /process\.env\.SUPABASE_SECRET_KEY/);
});

test("commands task surface remains backed by the browser Supabase client", async () => {
  const source = await read("src/components/CommandsQueue.tsx");
  assert.match(source, /createBrowserSupabase\(\)/);
});
