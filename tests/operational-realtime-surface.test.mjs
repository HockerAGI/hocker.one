import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("owner actions surface uses the real AGI action queue instead of a placeholder", async () => {
  const page = await read("src/app/owner/actions/page.tsx");
  assert.match(page, /OwnerUnifiedApprovals/);
  assert.doesNotMatch(page, /Aquí irá el listado de acciones/);
  assert.doesNotMatch(page, /La siguiente fase conecta este panel/);
});

test("operational realtime bridge exists and uses the canonical browser Supabase client", async () => {
  const bridge = await read("src/components/OperationalRealtimeBridge.tsx");
  assert.match(bridge, /createBrowserSupabase/);
  assert.match(bridge, /hocker:project:/);
  assert.match(bridge, /operational_change/);
  assert.match(bridge, /router\.refresh/);
});

test("operational snapshot remains the server-side source of truth", async () => {
  const snapshot = await read("src/lib/hocker-operational-state.ts");
  assert.match(snapshot, /export async function getHockerOperationalSnapshot/);
  assert.match(snapshot, /from\("agi_action_queue"\)/);
  assert.match(snapshot, /from\("agi_agents"\)/);
  assert.match(snapshot, /from\("agi_runs"\)/);
  assert.match(snapshot, /from\("nodes"\)/);
});

test("realtime migration targets only approved operational tables", async () => {
  const migration = await read("supabase/migrations/20260901070000_operational_realtime_broadcast.sql");
  for (const table of ["agi_action_queue", "agi_agents", "agi_runs", "nodes"]) {
    assert.match(migration, new RegExp(`CREATE TRIGGER .*${table}`));
  }
  assert.match(migration, /hocker:project:/);
  assert.match(migration, /operational_change/);
  assert.match(migration, /is_project_member\(split_part\(realtime\.topic\(\), ':', 3\)\)/);
});
