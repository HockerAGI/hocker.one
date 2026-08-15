import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("server Supabase auth accepts canonical server-scoped preview environment fallbacks", async () => {
  const serverClient = await read("src/lib/supabase-server.ts");

  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(serverClient, /SUPABASE_URL/);
  assert.match(serverClient, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(serverClient, /SUPABASE_PUBLISHABLE_KEY/);
});

test("server Supabase auth accepts Vercel HockerSupabase URL aliases after canonical names", async () => {
  const serverClient = await read("src/lib/supabase-server.ts");
  const urlChain = serverClient.match(/const supabaseUrl =[\s\S]*?;\n/)?.[0] ?? "";

  const canonicalPublic = urlChain.indexOf("NEXT_PUBLIC_SUPABASE_URL");
  const canonicalServer = urlChain.indexOf("SUPABASE_URL");
  const aliasPublic = urlChain.indexOf("NEXT_PUBLIC_HockerSupabase_SUPABASE_URL");
  const aliasServer = urlChain.indexOf("HockerSupabase_SUPABASE_URL");

  assert.ok(canonicalPublic >= 0, "missing NEXT_PUBLIC_SUPABASE_URL");
  assert.ok(canonicalServer > canonicalPublic, "SUPABASE_URL must follow public canonical URL");
  assert.ok(aliasPublic > canonicalServer, "public HockerSupabase URL alias must follow canonical names");
  assert.ok(aliasServer > aliasPublic, "server HockerSupabase URL alias must follow public alias");
});

test("server Supabase auth accepts publishable and anon aliases without secret-key fallback", async () => {
  const serverClient = await read("src/lib/supabase-server.ts");
  const keyChain = serverClient.match(/const supabaseKey =[\s\S]*?;\n/)?.[0] ?? "";

  const expectedInOrder = [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_HockerSupabase_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_HockerSupabase_SUPABASE_ANON_KEY",
    "HockerSupabase_SUPABASE_PUBLISHABLE_KEY",
    "HockerSupabase_SUPABASE_ANON_KEY",
  ];

  let previous = -1;
  for (const name of expectedInOrder) {
    const index = keyChain.indexOf(name);
    assert.ok(index > previous, `${name} must be present in canonical-to-alias precedence order`);
    previous = index;
  }

  assert.doesNotMatch(keyChain, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(keyChain, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(keyChain, /HockerSupabase_SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(keyChain, /HockerSupabase_SUPABASE_SERVICE_ROLE_KEY/);
});
