import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("workers console is discoverable from operations navigation", async () => {
  const sidebar = await read("src/components/Sidebar.tsx");
  const page = await read("src/app/workers/page.tsx");

  assert.match(sidebar, /href: "\/workers"/);
  assert.match(sidebar, /Trabajadores AGI/);
  assert.match(page, /VerifiableWorkersConsole/);
});

test("workers API keeps reads private and writes role-gated", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");

  assert.match(route, /requireProjectRole\(projectId, \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(route, /requireProjectRole\(action\.project_id, \["owner", "admin", "operator"\]\)/);
  assert.match(route, /requireProjectRole\(action\.project_id, \["owner"\]\)/);
  assert.match(route, /authorization: `Bearer \$\{key\}`/);
  assert.match(route, /NOVA_ORCHESTRATOR_KEY/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_NOVA_ORCHESTRATOR_KEY/);
});

test("console displays evidence and does not imply direct AGI writes", async () => {
  const console = await read("src/components/workers/VerifiableWorkersConsole.tsx");

  assert.match(console, /result_hash/);
  assert.match(console, /evidence/);
  assert.match(console, /attempt_count/);
  assert.match(console, /write_policy/);
  assert.match(console, /Owner Gate/);
  assert.match(console, /Loop automático/);
  assert.match(console, /El código está preparado, pero el esquema todavía no está activo/);
  assert.doesNotMatch(console, /conciencia real/i);
});

test("manual execution processes one task and stale recovery remains explicit", async () => {
  const console = await read("src/components/workers/VerifiableWorkersConsole.tsx");
  const route = await read("src/app/api/agi/workers/route.ts");

  assert.match(console, /operation: "run_once"/);
  assert.match(console, /operation: "recover_stale"/);
  assert.match(route, /\/api\/v1\/agi\/workers\/run-once/);
  assert.match(route, /\/api\/v1\/agi\/workers\/recover-stale/);
});
