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
  const migration = await source("supabase/migrations/20260816215532_hocker_nova_service_only_policy_intent.sql");
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
  assert.match(agents, /docs\/operations\/INDEX\.md/);
  assert.match(agents, /active handoff/i);
  assert.match(agents, /LAST_KNOWN_STATE\.md/);
  assert.match(agents, /At startup:/i);
  assert.match(agents, /At a material milestone,/i);
  assert.match(agents, /Do not duplicate the same narrative/i);
});

test("HOCKER cleanup rule is durable across code, docs and providers", async () => {
  const [agents, readme] = await Promise.all([source("AGENTS.md"), source("README.md")]);
  for (const contract of [
    /useful and current → keep/i,
    /useful but stale → rebuild\/adapt/i,
    /overlapping → merge/i,
    /no value for understanding, operating, recovering or auditing → discard/i,
  ]) {
    assert.match(agents, contract);
  }
  for (const contract of [
    /aporta y sigue vigente → conservar/i,
    /aporta pero quedó viejo → reconstruir\/adaptar/i,
    /se solapa → fusionar/i,
    /no ayuda a comprender, operar, recuperar o auditar → eliminar\/descartar/i,
  ]) {
    assert.match(readme, contract);
  }
  assert.match(agents, /Supabase/i);
  assert.match(agents, /Vercel/i);
  assert.match(agents, /`nova\.agi`/i);
  assert.match(agents, /`hocker-node-agent`/i);
});

test("current UX and score-v3 recovery contracts stay explicit without freezing mutable wrappers", async () => {
  const [readme, handoff, closure] = await Promise.all([
    source("README.md"),
    source("docs/operations/HANDOFF_2026-08-19.md"),
    source("docs/operations/PLATFORM_CLOSURE_2026-08-19.md"),
  ]);

  assert.match(readme, /`\/chat`/);
  assert.match(readme, /`\/agis`/);
  assert.match(readme, /score-v3/);
  assert.match(readme, /npm ci/);
  assert.match(readme, /npm run typecheck/);

  assert.match(handoff, /release funcional promovido por PR #243/i);
  assert.match(handoff, /candidate final(?:\s+#243)?[^`\n]*`[0-9a-f]{40}`/i);
  assert.match(handoff, /CI candidate[^\n]*SUCCESS/i);
  assert.match(handoff, /Preview exacto[^\n]*READY/i);
  assert.match(handoff, /merge funcional(?:\s+#243)?[^`\n]*`[0-9a-f]{40}`/i);
  assert.match(handoff, /producción funcional(?: inicial)?[^\n]*READY/i);
  assert.match(handoff, /Regla autoestable/i);
  assert.match(handoff, /PR #213[\s\S]*Cerrado|Cerrado[\s\S]*PR #213/i);

  assert.match(closure, /OPEN_PROVIDER_GATE/);
  assert.match(closure, /Owner AAL2 ceremony/);
  assert.match(closure, /score-v3/);
});

test("context freshness policy makes operational continuity event-driven and memory review-only", async () => {
  const [policy, bridge, protocol] = await Promise.all([
    source("docs/operations/CONTEXT_FRESHNESS_POLICY.md"),
    source("docs/operations/CONTEXT_BRIDGE_V1.md"),
    source("docs/operations/CONTINUITY_PROTOCOL.md"),
  ]);

  assert.match(policy, /milestone|hito/i);
  assert.match(policy, /17 8 \* \* \*/);
  assert.match(policy, /CRON_SECRET/);
  assert.match(policy, /GitHub App|webhook/i);
  assert.match(policy, /changes\.watch/);
  assert.match(policy, /renew|renov/i);
  assert.match(policy, /Memory Mirror/i);
  assert.match(policy, /revisad|review/i);
  assert.match(policy, /chat crudo|raw chat/i);
  assert.match(policy, /credencial|secret/i);
  assert.match(policy, /manifiest/i);
  assert.match(policy, /AAL2/i);
  assert.match(bridge, /capability.*evidence|evidencia.*capacidad/i);
  assert.match(protocol, /CONTEXT_FRESHNESS_POLICY\.md/);
});

test("recovery card keeps current production and certification pointers explicit", async () => {
  const state = await source("docs/operations/LAST_KNOWN_STATE.md");
  assert.match(state, /REQUERY MUTABLE FACTS BEFORE ACTION/);
  assert.match(state, /HANDOFF_2026-08-30\.md/);
  assert.match(state, /## Current verified pointers/);
  assert.match(state, /No production DDL\/grants\/RLS changes have been applied/i);
  assert.match(state, /Core AGI certification:.*2026\.08\.21-8.*score-v5/i);
  assert.match(state, /#303.*CLOSED \/ COMPLETED/i);
  assert.match(state, /#306.*OPEN \/ P0 production-readiness master gate/i);
  assert.match(state, /allow_actions=false/);
  assert.match(state, /Supabase project `yvuibbcuntqpyqiuqggd`/);
  assert.match(state, /Historical evidence is preserved/i);
  assert.doesNotMatch(state, /32244656734|TS18047|progress possibly null/i);
  assert.doesNotMatch(state, /f122b15c8136c8885edfd24396115c6bda1b6329/);
  assert.doesNotMatch(state, /dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf/);
  assert.doesNotMatch(state, /9dfdc688f73f6cad69c40179c1bb3a0a831bbb45/);
});

// Keep the file content stable; this commit exists only to re-run the exact-head gate.
