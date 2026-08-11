import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner session gate requires authenticated owner membership and AAL2 for critical access", async () => {
  const gate = await read("src/lib/owner-session-gate.ts");

  assert.match(gate, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(gate, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(gate, /owner_auth_not_configured/);
  assert.match(gate, /auth\.getUser\(\)/);
  assert.match(gate, /from\("project_members"\)/);
  assert.match(gate, /role !== "owner"/);
  assert.match(gate, /mfa\.getAuthenticatorAssuranceLevel\(\)/);
  assert.match(gate, /currentLevel !== "aal2"/);
  assert.match(gate, /owner_mfa_required/);
});

test("Chido admin protects service-role reads before creating the admin client", async () => {
  const page = await read("src/app/chido/admin/page.tsx");
  const guardIndex = page.indexOf('await requireOwnerAal2Page("/chido/admin")');
  const adminClientIndex = page.indexOf("const sb = createAdminSupabase()");

  assert.ok(guardIndex >= 0, "Chido admin must invoke the Owner AAL2 page guard");
  assert.ok(adminClientIndex >= 0, "Chido admin must still create its server-only admin client");
  assert.ok(guardIndex < adminClientIndex, "Owner AAL2 must be checked before service-role reads");
});

test("Chido admin API uses the authenticated Owner AAL2 session rather than shared key authorization", async () => {
  const route = await read("src/app/api/chido/admin/route.ts");

  assert.match(route, /requireOwnerAal2Api\(\)/);
  assert.doesNotMatch(route, /hocker-owner-api-gate/);
  assert.doesNotMatch(route, /requireOwnerOrInternal/);
  assert.match(route, /hocker-owner:\$\{ownerGate\.userId\}/);
});

test("Chido admin client relies on the authenticated session and does not send a shared Owner key", async () => {
  const panel = await read("src/app/chido/admin/AdminPanel.tsx");

  assert.match(panel, /fetch\("\/api\/chido\/admin"/);
  assert.doesNotMatch(panel, /__HOCKER_OWNER_KEY/);
  assert.doesNotMatch(panel, /x-hocker-owner-key/i);
});

test("Owner MFA flow supports verified TOTP challenge and first-time TOTP enrollment", async () => {
  const component = await read("src/components/OwnerMfaStepUp.tsx");

  assert.match(component, /mfa\.getAuthenticatorAssuranceLevel\(\)/);
  assert.match(component, /mfa\.listFactors\(\)/);
  assert.match(component, /mfa\.enroll\(\{\s*factorType: "totp"/);
  assert.match(component, /mfa\.challengeAndVerify\(\{/);
  assert.match(component, /currentLevel !== "aal2"/);
});

test("MFA return targets are restricted to local application paths", async () => {
  const gate = await read("src/lib/owner-session-gate.ts");

  assert.match(gate, /export function sanitizeOwnerReturnTo/);
  assert.match(gate, /startsWith\("\/"\)/);
  assert.match(gate, /startsWith\("\/\/"\)/);
  assert.match(gate, /return "\/owner"/);
});
