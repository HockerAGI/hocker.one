import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("server Supabase auth accepts server-scoped preview environment fallbacks", async () => {
  const serverClient = await read("src/lib/supabase-server.ts");

  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(serverClient, /SUPABASE_URL/);
  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(serverClient, /SUPABASE_PUBLISHABLE_KEY/);
});
