import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("continuity reconciler is read-only toward GitHub and writes normalized checkpoints", async () => {
  const code = await source("src/lib/project-continuity.ts");
  assert.match(code, /createContextBridgeCheckpoint/);
  assert.match(code, /\/user\/repos\?affiliation=owner/);
  assert.match(code, /github\.ecosystem/);
  assert.match(code, /supabase\.agi-evidence/);
  assert.match(code, /vercel\.hocker-one-runtime/);
  assert.doesNotMatch(code, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
});

test("continuity cron fails closed and cannot activate manifests or external writes", async () => {
  const route = await source("src/app/api/context-bridge/reconcile/route.ts");
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /HOCKER_ONE_INTERNAL_TOKEN/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /manifest_activated:\s*false/);
  assert.match(route, /external_mutations:\s*false/);
  assert.match(route, /status:\s*401/);
});

test("Vercel continuity backstop stays compatible with once-daily Hobby cron", async () => {
  const config = JSON.parse(await source("vercel.json"));
  const continuity = config.crons?.find((cron) => cron.path === "/api/context-bridge/reconcile");
  assert.ok(continuity);
  assert.equal(continuity.schedule, "17 8 * * *");
});

test("general CI does not spend a full run on Markdown-only changes", async () => {
  const workflow = await source(".github/workflows/ci.yml");
  assert.match(workflow, /paths-ignore:/);
  assert.match(workflow, /"\*\*\/\*\.md"/);
});

test("backend-only Hocker One and NOVA tables get explicit deny policies without new grants", async () => {
  const migration = await source("supabase/migrations/20260816061500_hocker_nova_service_only_policy_intent.sql");
  for (const relation of [
    "private.nova_rate_limit_buckets",
    "public.agi_chat_messages",
    "public.agi_integration_checks",
    "public.agi_runtime_tokens",
    "public.context_bridge_capabilities",
    "public.context_bridge_checkpoints",
    "public.context_bridge_coverage",
    "public.context_bridge_manifests",
    "public.context_bridge_sources",
    "public.owner_gate_approvals",
  ]) {
    assert.match(migration, new RegExp(relation.replaceAll(".", "\\.")));
  }
  assert.match(migration, /to anon, authenticated using \(false\) with check \(false\)/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete|all)/i);
});

test("agent contract requires durable recovery and milestone handoff", async () => {
  const agents = await source("AGENTS.md");
  assert.match(agents, /CONTINUITY_PROTOCOL\.md/);
  assert.match(agents, /LAST_KNOWN_STATE\.md/);
  assert.match(agents, /Protocolo obligatorio al iniciar trabajo/);
  assert.match(agents, /Protocolo obligatorio de handoff/);
});
