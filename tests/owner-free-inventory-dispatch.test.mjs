import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker, { processOneApprovedInventory } from "../infra/cloudflare/nova-coordinator/index.mjs";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const key = "i".repeat(48);
const bypass = "b".repeat(32);
const env = {
  NOVA_FREE_INVENTORY_ENABLED: "true",
  NOVA_FREE_INVENTORY_TOKEN: key,
  NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN: bypass,
};
const completed = {
  ok: true, processed: true, status: "completed",
  task_id: "11111111-1111-4111-8111-111111111111",
  run_id: "22222222-2222-4222-8222-222222222222",
  result_hash: "a".repeat(64), source: "supabase_live_count_only",
  model_requests: 0, tools_executed: 0,
  external_writes_executed: false, no_paid_fallback: true,
};
const json = (data = completed, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json" },
});

test("Free inventory is inert unless its independent dispatch switch is on", async () => {
  let calls = 0;
  const result = await processOneApprovedInventory({}, () => { calls++; });
  assert.equal(calls, 0);
  assert.deepEqual(result, { ok: true, processed: false, code: "FREE_INVENTORY_DISABLED" });
  const health = await worker.fetch(new Request("https://test.example/health"));
  assert.equal((await health.json()).task_executor, false);
});

test("Cron dispatch uses one fixed POST endpoint, distinct token, bounded payload and no model", async () => {
  let calls = 0;
  const r = await processOneApprovedInventory(env, async (url, options) => {
    calls++;
    assert.equal(url, "https://hockerone.vercel.app/api/internal/nova-free-inventory");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer " + key);
    assert.equal(options.headers["x-vercel-protection-bypass"], bypass);
    assert.equal(options.redirect, "manual");
    assert.deepEqual(JSON.parse(options.body), {
      contract_version: 1, project_id: "hocker-one",
      action: "process_one_owner_approved_inventory",
    });
    assert.equal(options.body.includes("prompt"), false);
    return json();
  });
  assert.equal(calls, 1);
  assert.equal(r.ok, true);
  assert.equal(r.processed, true);
  assert.equal(r.model_requests, 0);
  assert.equal(JSON.stringify(r).includes(key), false);
  assert.equal(JSON.stringify(r).includes(bypass), false);
});

test("No approved task, expired authorization and arbitrary data cannot trigger inference", async () => {
  for (const reason of ["NO_OWNER_APPROVED_INVENTORY", "OWNER_APPROVAL_EXPIRED"]) {
    const r = await processOneApprovedInventory(env, () => json({
      ok: true, processed: false, reason, model_requests: 0, task_claims: 0,
    }));
    assert.equal(r.ok, true);
    assert.equal(r.processed, false);
  }
  for (const data of [
    { ...completed, model_requests: 1 },
    { ...completed, tools_executed: 1 },
    { ...completed, external_writes_executed: true },
    { ...completed, no_paid_fallback: false },
    { ...completed, source: "fake" },
    { ...completed, status: "working" },
    { ...completed, result_hash: "invalid" },
    { ok: true, processed: false, reason: "OTHER_TASK", model_requests: 0, task_claims: 0 },
    { ok: true, processed: false, reason: "NO_OWNER_APPROVED_INVENTORY", model_requests: 1, task_claims: 0 },
    { ok: true, processed: false, reason: "NO_OWNER_APPROVED_INVENTORY", model_requests: 0, task_claims: 1 },
  ]) {
    await assert.rejects(processOneApprovedInventory(env, () => json(data)),
      /COORDINATOR_INVENTORY_CONTRACT_INVALID/);
  }
});

test("Malformed credentials, protected redirects, upstream errors and oversized response fail closed", async () => {
  await assert.rejects(processOneApprovedInventory({ ...env, NOVA_FREE_INVENTORY_TOKEN: "short" }),
    /COORDINATOR_INVENTORY_TOKEN_INVALID/);
  await assert.rejects(processOneApprovedInventory({ ...env, NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN: "" }),
    /COORDINATOR_INVENTORY_BYPASS_MISSING/);
  await assert.rejects(processOneApprovedInventory(env, () => json({}, 401)),
    /COORDINATOR_INVENTORY_HTTP_401/);
  await assert.rejects(processOneApprovedInventory(env,
    () => new Response(null, { status: 302, headers: { Location: "https://evil.example" } })),
    /COORDINATOR_INVENTORY_HTTP_302/);
  await assert.rejects(processOneApprovedInventory(env,
    () => new Response("x".repeat(3000), { status: 200,
      headers: { "Content-Type": "application/json" } })),
    /COORDINATOR_INVENTORY_RESPONSE_TOO_LARGE/);
  await assert.rejects(processOneApprovedInventory(env,
    () => new Response("{bad json", { status: 200,
      headers: { "Content-Type": "application/json" } })),
    /COORDINATOR_INVENTORY_RESPONSE_NOT_JSON/);
});

test("SQL one-time Owner grant and execution use atomic, service-role-only, exact-task gates", async () => {
  const sql = await read("supabase/migrations/20261116211500_owner_granted_serverless_inventory_v1.sql");
  assert.match(sql, /CREATE OR REPLACE FUNCTION public.owner_schedule_free_inventory_v1/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public.run_owner_free_inventory_v1/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /SET search_path TO 'pg_catalog','public','extensions','pg_temp'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.owner_schedule_free_inventory_v1\(text,uuid\)/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.run_owner_free_inventory_v1\(text,text\)/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.run_owner_free_inventory_v1\(text,text\)/);
  assert.match(sql, /idempotency_key=v_key/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /v_task\.max_attempts IS DISTINCT FROM 1/);
  assert.match(sql, /v_task\.created_by IS NULL/);
  assert.match(sql, /owner-aal2-serverless-inventory-v1/);
  assert.match(sql, /extensions\.digest\(v_output::text,'sha256'\)/);
  assert.match(sql, /'model_requests',0/);
  assert.match(sql, /'tools_executed',0/);
  assert.match(sql, /'no_paid_fallback',true/);
  const executableSql = sql.split("\n").filter((line) => !line.trimStart().startsWith("--")).join("\n");
  assert.doesNotMatch(executableSql, /claim_next_agi_task|runUnifiedAgiWorkerOnce|completeAgi\(/);
});

test("Both HTTP gates require Owner MFA or independent authenticated Cron, never generic run_once", async () => {
  const [owner, cron, page, panel, workerCode] = await Promise.all([
    read("src/app/api/agi/free-inventory/route.ts"),
    read("src/app/api/internal/nova-free-inventory/route.ts"),
    read("src/app/workers/page.tsx"),
    read("src/components/workers/FreeScheduledInventoryPanel.tsx"),
    read("infra/cloudflare/nova-coordinator/index.mjs"),
  ]);
  assert.match(owner, /await requireOwnerAal2Api\(PROJECT\)/);
  assert.match(owner, /validOrigin/);
  assert.match(owner, /confirm: z\.literal\(true\)/);
  assert.match(owner, /owner_schedule_free_inventory_v1/);
  assert.match(cron, /NOVA_FREE_INVENTORY_TOKEN/);
  assert.match(cron, /timingSafeEqual/);
  assert.match(cron, /process_one_owner_approved_inventory/);
  assert.match(cron, /run_owner_free_inventory_v1/);
  assert.match(cron, /NOVA_FREE_INVENTORY_ENABLED !== "true"/);
  assert.doesNotMatch(cron, /NOVA_COORDINATOR_READ_TOKEN|claim_next_agi_task|run_once|completeAgi\(/);
  assert.match(page, /FreeScheduledInventoryPanel/);
  assert.match(panel, /window\.confirm/);
  assert.doesNotMatch(panel, /setInterval|setTimeout|dangerouslySetInnerHTML/);
  assert.match(workerCode, /processOneApprovedInventory\(env\)/);
  assert.match(workerCode, /if \(env\.NOVA_FREE_INVENTORY_ENABLED === "true"\)/);
  assert.doesNotMatch(workerCode, /CLOUDFLARE_WORKERS_AI_API_TOKEN/);
});
