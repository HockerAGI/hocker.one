import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("server Supabase client supports the modern publishable key as a fallback for password auth", async () => {
  const server = await read("src/lib/supabase-server.ts");
  assert.match(server, /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\?\?\s*process\.env\.SUPABASE_PUBLISHABLE_KEY/);
});

test("password login keeps modern and legacy Supabase key compatibility without exposing secrets", async () => {
  const route = await read("src/app/api/auth/password-login/route.ts");
  assert.match(route, /createServerSupabase\(\)/);
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY/);
  assert.match(route, /signInWithPassword/);
});
