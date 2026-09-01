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

test("realtime migration targets only approved operational event flow", async () => {
  const migration = await read("supabase/migrations/20260901070000_operational_event_fabric.sql");
  assert.match(migration, /hocker_operational_events/);
  assert.match(migration, /supabase_realtime/);
  assert.match(migration, /agi_action_queue/);
  assert.match(migration, /agi_agents/);
  assert.match(migration, /agi_runs/);
  assert.match(migration, /nodes/);
  assert.match(migration, /project_id/);
});
