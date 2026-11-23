import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Login visual uses canonical HOCKER wordmark with a responsive and accessible form", async () => {
  const [surface, auth] = await Promise.all([
    read("src/components/hocker-2c/auth/HockerOwnerLoginSurface.tsx"),
    read("src/components/AuthBox.tsx"),
  ]);
  assert.match(surface, /\/brand\/hocker-one-logo\.png/);
  assert.match(surface, /Bienvenido/);
  assert.match(surface, /lg:grid-cols/);
  assert.match(surface, /<AuthBox/);
  assert.match(auth, /min-h-12/);
  assert.match(auth, /role="alert"/);
  assert.match(auth, /focus-visible:/);
  assert.match(auth, /type=\{showPassword \? "text" : "password"\}/);
});

test("Password login preserves exact credentials and distinguishes backend issues", async () => {
  const [auth, route, server, privateGate] = await Promise.all([
    read("src/components/AuthBox.tsx"),
    read("src/app/api/auth/password-login/route.ts"),
    read("src/lib/supabase-server.ts"),
    read("src/lib/require-private-session.ts"),
  ]);
  assert.match(auth, /const cleanPassword = password;/);
  assert.doesNotMatch(auth, /password\.trim\(\)/);
  assert.match(auth, /credentials: "same-origin"/);
  assert.match(auth, /fetch\("\/api\/auth\/password-login"/);
  assert.match(auth, /result\.redirectTo \|\| "\/owner"/);
  assert.match(route, /supabase\.auth\.signInWithPassword/);
  assert.match(route, /status: serviceUnavailable \? 503 : 401/);
  assert.match(route, /status: 503/);
  assert.match(server, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(privateGate, /project_members/);
  assert.doesNotMatch(server, /HockerSupabase_SUPABASE_SECRET_KEY/);
});
