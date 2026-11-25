import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Owner mirror derives service verification from a protected, no-store readiness read", async () => {
  const component = await read("src/components/owner/OwnerProviderMirror.tsx");
  const page = await read("src/app/owner/page.tsx");
  const endpoint = await read("src/app/api/agi/runtime/integrations/readiness/route.ts");

  assert.match(component, /fetch\("\/api\/agi\/runtime\/integrations\/readiness"/);
  assert.match(component, /cache: "no-store"/);
  assert.match(component, /credentials: "same-origin"/);
  assert.match(component, /production_scope_verified === true/);
  assert.match(component, /github\.verified_read === true/);
  assert.match(component, /vercel\.verified_read === true/);
  assert.match(component, /"github_app"/);
  assert.match(component, /"pat"/);
  assert.match(component, /MFA Owner/);
  assert.match(component, /no una lista de credenciales guardadas/);
  assert.doesNotMatch(component, /process\.env|PRIVATE_KEY|VERCEL_TOKEN|HOCKER_GITHUB_TOKEN/);

  assert.match(page, /evidence\.nodeCount !== null \|\| evidence\.agiCount !== null/);
  assert.match(page, /agiCount: evidence\.agiCount, nodeCount: evidence\.nodeCount/);
  assert.match(page, /<OwnerProviderMirror/);
  assert.match(endpoint, /requireOwnerAal2Api\(PROJECT_ID\)/);
  assert.match(endpoint, /authentication_scope: "read_only_verified_no_write_attestation"/);
});

test("Unavailable Supabase counts never render as confirmed zero", async () => {
  const source = await read("src/lib/hocker-live-pulse-summary.ts");
  const status = await read("src/components/owner/OwnerUnifiedStatus.tsx");
  assert.match(source, /SUPABASE_PULSE_COUNT_UNAVAILABLE/);
  assert.match(source, /learningSeen\.error \|\| memorySeen\.error/);
  assert.match(status, /value \?\? "—"/);
  assert.match(status, /Los valores sin verificar no son cero/);
});

test("Mirror layout follows existing brand and accessible UX constraints", async () => {
  const css = await read("src/styles/owner-unified.css");
  const layout = await read("src/app/layout.tsx");
  const component = await read("src/components/owner/OwnerProviderMirror.tsx");
  assert.match(css, /"mirror mirror"/);
  assert.match(css, /\.hko-mirror-grid/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /--font-inter/);
  assert.match(layout, /import \{ Outfit \} from "next\/font\/google"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /<details className="hko-mirror-details">/);
  assert.doesNotMatch(component, /allow_actions\s*=\s*true/);
});
