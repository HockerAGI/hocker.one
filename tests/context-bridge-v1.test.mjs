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

test("Context Bridge builds coverage manifests and only an owner can activate them", async () => {
  const [contract, manifestsRoute, activeRoute, sql] = await Promise.all([
    read("src/lib/context-bridge.ts"),
    read("src/app/api/context-bridge/manifests/route.ts"),
    read("src/app/api/context-bridge/manifests/active/route.ts"),
    read("supabase/migrations/20260808194500_context_bridge_v1.sql"),
  ]);

  assert.match(contract, /ContextBridgeManifestSchema/);
  assert.match(contract, /createContextBridgeManifest/);
  assert.match(contract, /getActiveContextBridgeManifest/);
  for (const coverageState of ["complete", "missing", "stale"]) {
    assert.match(contract, new RegExp(`"${coverageState}"`));
  }
  assert.match(contract, /create_context_bridge_manifest/);
  assert.match(manifestsRoute, /ownerGate\.actor !== "owner"/);
  assert.match(manifestsRoute, /activate_context_bridge_manifest/);
  assert.match(activeRoute, /getActiveContextBridgeManifest/);
  assert.match(sql, /create or replace function public\.create_context_bridge_manifest\(p_payload jsonb\)/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /CONTEXT_MANIFEST_COVERAGE_INCOMPLETE/);
  assert.match(sql, /revoke all on function public\.create_context_bridge_manifest\(jsonb\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.create_context_bridge_manifest\(jsonb\) to service_role/i);
});
