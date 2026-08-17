import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Context Bridge keeps operational continuity separate from approved Memory Mirror knowledge", async () => {
  const [contract, docs] = await Promise.all([
    read("src/lib/context-bridge.ts"),
    read("docs/operations/CONTEXT_BRIDGE_V1.md"),
  ]);

  for (const source of ["chatgpt", "codex", "github", "google_drive", "supabase", "vercel"]) {
    assert.match(contract, new RegExp(`\\b${source}\\b`));
  }

  assert.match(contract, /CONTEXT_SOURCE_PRECEDENCE/);
  assert.match(contract, /production_state[\s\S]*git_code[\s\S]*verified_contract[\s\S]*approved_canon[\s\S]*external_knowledge[\s\S]*conversation/);
  assert.match(contract, /containsSecretMaterial/);
  assert.match(contract, /raw_content[\s\S]*transcript[\s\S]*messages/);
  assert.match(contract, /mutates_external[\s\S]*owner_gate_required/);
  assert.match(docs, /Memory Mirror/i);
  assert.match(docs, /no reemplaza/i);
  assert.match(docs, /ChatGPT[\s\S]*Codex[\s\S]*GitHub[\s\S]*Drive[\s\S]*Supabase[\s\S]*Vercel/i);
  assert.match(docs, /secretos/i);
});

test("Context Bridge persistence is service-only, evidence-backed and owner-gated", async () => {
  const sql = await read("supabase/migrations/20260808194500_context_bridge_v1.sql");

  for (const table of [
    "context_bridge_sources",
    "context_bridge_checkpoints",
    "context_bridge_manifests",
    "context_bridge_coverage",
    "context_bridge_capabilities",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant all on table public\\.${table} to service_role`, "i"));
  }

  assert.match(sql, /contains_secrets boolean not null default false[\s\S]*check \(contains_secrets = false\)/i);
  assert.match(sql, /activate_context_bridge_manifest/i);
  assert.match(sql, /record_context_bridge_checkpoint/i);
  assert.match(sql, /owner_approved = true/i);
  assert.match(sql, /revoke all on function public\.activate_context_bridge_manifest\(uuid, text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.activate_context_bridge_manifest\(uuid, text\) to service_role/i);
  assert.match(sql, /revoke all on function public\.record_context_bridge_checkpoint\(jsonb\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.record_context_bridge_checkpoint\(jsonb\) to service_role/i);
  assert.match(sql, /create or replace function public\.context_bridge_set_updated_at\(\)/i);
  assert.match(sql, /execute function public\.context_bridge_set_updated_at\(\)/i);
  assert.doesNotMatch(sql, /execute function public\.set_updated_at\(\)/i);
  assert.match(sql, /context_bridge_manifests_previous_manifest_idx[\s\S]*previous_manifest_id/i);
  assert.doesNotMatch(sql, /create\s+policy/i);
});

test("Context Bridge API accepts normalized checkpoints but never raw conversations", async () => {
  const [route, contract] = await Promise.all([
    read("src/app/api/context-bridge/checkpoints/route.ts"),
    read("src/lib/context-bridge.ts"),
  ]);

  assert.match(route, /validateHockerOwnerApiGate/);
  assert.match(route, /createContextBridgeCheckpoint/);
  assert.match(route, /owner_gate_actor/);
  assert.match(contract, /\.strict\(\)/);
  assert.match(contract, /summary: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(4000\)/);
  assert.match(contract, /source_revision/);
  assert.match(contract, /canonical_refs/);
  assert.match(contract, /content_hash/);
  assert.doesNotMatch(route, /executeTool|registry\.execute|mcpRegistry/);
});

test("Context Bridge key-based manifest API is draft-only", async () => {
  const route = await read("src/app/api/context-bridge/manifests/route.ts");

  assert.match(route, /validateHockerOwnerApiGate/);
  assert.match(route, /createContextBridgeManifest/);
  assert.match(route, /parsed\.data\.activate/);
  assert.match(route, /requiere una sesión Owner con MFA AAL2/i);
  assert.doesNotMatch(route, /record_owner_gate_approval/);
  assert.doesNotMatch(route, /activate_context_bridge_manifest_v2/);
});

test("Context Bridge activation requires a human Owner AAL2 session and one-time evidence", async () => {
  const [activationRoute, page, evidenceMigration, aal2Migration] = await Promise.all([
    read("src/app/api/context-bridge/manifests/activate/route.ts"),
    read("src/app/owner/context-bridge/page.tsx"),
    read("supabase/migrations/20260810123000_owner_gate_approval_evidence_v1.sql"),
    read("supabase/migrations/20260811213000_context_bridge_owner_aal2_evidence.sql"),
  ]);

  assert.match(activationRoute, /requireOwnerAal2Api\(\)/);
  assert.match(activationRoute, /ownerSession\.userId/);
  assert.match(activationRoute, /supabase-session-aal2/);
  assert.match(activationRoute, /record_owner_gate_approval/);
  assert.match(activationRoute, /activate_context_bridge_manifest_v2/);
  assert.match(activationRoute, /current_aal: ownerSession\.currentLevel/);
  assert.match(page, /requireOwnerAal2Page\("\/owner\/context-bridge"\)/);
  assert.match(evidenceMigration, /OWNER_APPROVAL_ALREADY_CONSUMED/);
  assert.match(evidenceMigration, /interval '15 minutes'/i);
  assert.match(aal2Migration, /supabase-session-aal2/);
  assert.match(aal2Migration, /owner_gate_approvals_accepted_header_check/);
});

test("Context Bridge builds coverage manifests and keeps active reads evidence-backed", async () => {
  const [contract, coverageContract, activeRoute, sql] = await Promise.all([
    read("src/lib/context-bridge.ts"),
    read("src/lib/context-bridge-coverage.ts"),
    read("src/app/api/context-bridge/manifests/active/route.ts"),
    read("supabase/migrations/20260808194500_context_bridge_v1.sql"),
  ]);

  assert.match(contract, /ContextBridgeManifestSchema/);
  assert.match(contract, /createContextBridgeManifest/);
  assert.match(contract, /getActiveContextBridgeManifest/);
  for (const coverageState of ["complete", "partial", "missing", "stale", "blocked"]) {
    assert.match(`${contract}\n${coverageContract}`, new RegExp(`"${coverageState}"`));
  }
  assert.match(contract, /create_context_bridge_manifest/);
  assert.match(activeRoute, /getActiveContextBridgeManifest/);
  assert.match(sql, /create or replace function public\.create_context_bridge_manifest\(p_payload jsonb\)/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /CONTEXT_MANIFEST_COVERAGE_INCOMPLETE/);
  assert.match(sql, /revoke all on function public\.create_context_bridge_manifest\(jsonb\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.create_context_bridge_manifest\(jsonb\) to service_role/i);
});

test("Context Bridge provider coverage cannot become complete from checkpoint recency alone", async () => {
  const [contract, coverageContract] = await Promise.all([
    read("src/lib/context-bridge.ts"),
    read("src/lib/context-bridge-coverage.ts"),
  ]);

  assert.match(contract, /deriveProviderCoverageStatus/);
  assert.match(contract, /providerCapabilities/);
  assert.match(contract, /newestSourceId/);
  assert.match(coverageContract, /freshCapabilities/);
  assert.match(coverageContract, /capability\.status === "blocked"/);
  assert.match(coverageContract, /capability\.status === "verified"/);
  assert.doesNotMatch(
    contract,
    /const status = !newest[\s\S]*observedAt < staleBefore[\s\S]*\? "stale"[\s\S]*: "complete"/,
  );
});
