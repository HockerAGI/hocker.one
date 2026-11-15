import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Worker status distinguishes exact project totals from capped recent results", async () => {
  const [api, ui] = await Promise.all([
    read("src/app/api/agi/workers/route.ts"),
    read("src/components/workers/VerifiableWorkersConsole.tsx"),
  ]);
  assert.match(api, /loadExactTaskCounts/);
  assert.match(api, /\.select\("id", \{ count: "exact", head: true \}\)/);
  assert.match(api, /\.eq\("project_id", projectId\)/);
  assert.match(api, /"queued", "pending", "working", "completed", "failed"/);
  assert.match(api, /loadStaleTaskReview/);
  assert.match(api, /\.in\("status", \["queued", "pending"\]\)/);
  assert.match(api, /\.lt\("created_at", cutoff\)/);
  assert.match(api, /\.limit\(101\)/);
  assert.doesNotMatch(api.slice(api.indexOf("async function loadStaleTaskReview("),
    api.indexOf("async function loadOperationalGates(")), /\.select\(".*payload|\.rpc\(|\.update\(/);
  assert.match(ui, /totals\.queued \+ totals\.pending/);
  assert.match(ui, /Totales del proyecto, no una muestra/);
  assert.match(ui, /Revisar trabajos pendientes/);
  assert.match(ui, /stale_review/);
  assert.match(ui, /id="revision-pendientes"/);
});

test("Owner cancellation is one task at a time, AAL2 verified and DB atomic", async () => {
  const [api, migration, ui] = await Promise.all([
    read("src/app/api/agi/workers/route.ts"),
    read("docs/operations/sql/owner_cancel_stale_agi_task_v1.reviewed.sql"),
    read("src/components/workers/VerifiableWorkersConsole.tsx"),
  ]);
  assert.match(api, /operation: z\.literal\("cancel_stale"\)/);
  assert.match(api, /task_id: z\.string\(\)\.uuid\(\)/);
  assert.match(api, /reason: z\.string\(\)\.trim\(\)\.min\(12\)\.max\(400\)/);
  const owner = api.indexOf("await requireOwnerAal2Api(ctx.project_id)");
  const rpc = api.indexOf('"owner_cancel_stale_agi_task_v1"');
  assert.ok(owner >= 0 && rpc > owner);
  assert.match(api, /p_owner_id: ctx\.user\.id/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /v_task\.status NOT IN \('queued', 'pending'\)/);
  assert.match(migration, /v_task\.created_at >= now\(\) - interval '24 hours'/);
  assert.match(migration, /v_task\.locked_at IS NOT NULL/);
  assert.match(migration, /v_task\.task_type <> 'analysis'/);
  assert.match(migration, /status = 'canceled'/);
  assert.match(migration, /INSERT INTO public\.events/);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/);
  assert.doesNotMatch(migration, /DELETE FROM public\.agi_tasks|TRUNCATE/);
  assert.match(ui, /window\.confirm/);
  assert.match(ui, /Cancelar solo esta tarea/);
  assert.match(ui, /Motivo de cancelación/);
});

test("Mobile screen shows the three actual blockers and hides large outputs by default", async () => {
  const [ui, page, api] = await Promise.all([
    read("src/components/workers/VerifiableWorkersConsole.tsx"),
    read("src/app/workers/page.tsx"),
    read("src/app/api/agi/workers/route.ts"),
  ]);
  assert.match(page, /compact/);
  assert.match(page, /title="Procesos AGI"/);
  assert.match(ui, /Leer resultado completo/);
  assert.match(ui, /ResultText value=\{summary\}/);
  assert.match(ui, /tasks\.slice\(0, visibleRecent\)/);
  assert.match(ui, /setVisibleRecent\(\(count\) => count \+ 6\)/);
  assert.match(ui, /Datos técnicos y trazabilidad/);
  assert.match(ui, /Crear una tarea nueva \(opcional\)/);
  assert.match(ui, /disabled=\{busy !== null \|\| !schemaReady \|\| executionBlocked\}/);
  assert.match(ui, /href="\/owner\/context-bridge"/);
  assert.match(ui, /href="\/nodes"/);
  assert.match(api, /loadOperationalGates\(projectId\)/);
  assert.match(api, /getContextBridgeCurrentProofs\(projectId\)/);
  assert.match(api, /deriveProviderCoverageStatus/);
  assert.match(api, /\.gt\("last_seen_at", cutoff\)/);
});
