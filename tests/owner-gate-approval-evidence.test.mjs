import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Context Bridge activation binds Owner Gate approval to action and resource", async () => {
  const [route, migration, retirement] = await Promise.all([
    read("src/app/api/context-bridge/manifests/route.ts"),
    read("supabase/migrations/20260810123000_owner_gate_approval_evidence_v1.sql"),
    read("supabase/migrations/20260810123500_owner_gate_approval_legacy_path_retirement.sql"),
  ]);

  assert.match(route, /record_owner_gate_approval/);
  assert.match(route, /activate_context_bridge_manifest_v2/);
  assert.match(route, /context_bridge\.activate_manifest/);
  assert.match(route, /context_bridge_manifest/);
  assert.match(route, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /trace_id/);
  assert.match(route, /nonce/);
  assert.doesNotMatch(route, /p_approved_by:\s*"hocker-owner-gate"/);

  assert.match(migration, /create table if not exists public\.owner_gate_approvals/i);
  assert.match(migration, /request_hash text not null/i);
  assert.match(migration, /approval_hash text not null/i);
  assert.match(migration, /candidate_sha text not null/i);
  assert.match(migration, /environment text not null/i);
  assert.match(migration, /trace_id uuid not null/i);
  assert.match(migration, /nonce uuid not null/i);
  assert.match(migration, /consumed_at timestamptz/i);
  assert.match(migration, /approval\.actor_type <> 'owner'/i);
  assert.match(migration, /OWNER_APPROVAL_SCOPE_MISMATCH/i);
  assert.match(migration, /OWNER_APPROVAL_ALREADY_CONSUMED/i);
  assert.match(migration, /OWNER_APPROVAL_EXPIRED/i);
  assert.match(migration, /grant all on table public\.owner_gate_approvals to service_role/i);

  assert.match(retirement, /drop function public\.activate_context_bridge_manifest\(uuid, text\)/i);
});
