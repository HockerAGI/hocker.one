import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Owner-only Context Bridge refresh reuses the existing reconciler without cron tokens or manifest activation", async () => {
  const route = await read("src/app/api/context-bridge/reconcile/owner/route.ts");
  const ui = await read("src/app/owner/context-bridge/ContextBridgeActivationPanel.tsx");
  assert.match(route, /requireOwnerAal2Api\("hocker-one"\)/);
  assert.match(route, /reconcileProjectContinuity\(\)/);
  assert.match(route, /z\.literal\("hocker-one"\)/);
  assert.match(route, /z\.literal\(true\)/);
  assert.match(route, /new URL\(origin\)\.host === host/);
  assert.match(route, /manifest_activated: false/);
  assert.match(route, /external_provider_mutations: false/);
  assert.doesNotMatch(route, /CRON_SECRET|createContextBridgeManifest|activate_context_bridge_manifest|claim_next_agi_task|executeCommand|completeAgi/);
  assert.match(ui, /\/api\/context-bridge\/reconcile\/owner/);
  assert.match(ui, /refreshConnectedSources/);
  assert.match(ui, /window\.confirm/);
  assert.doesNotMatch(ui, /setInterval\(refreshConnectedSources/);
});

test("free Owner pilot cannot silently change default chat or global AGI paid routing", async () => {
  const [policy,provider,pilot] = await Promise.all([
    read("src/lib/cloudflare-zero-credit-policy.ts"),
    read("src/lib/agi-model-providers/cloudflare-workers-ai.ts"),
    read("src/app/api/agi/free-pilot/route.ts"),
  ]);
  assert.match(policy, /export function cloudflareFreePilotConfigured/);
  assert.match(policy, /AGI_FREE_READONLY_PILOT_ENABLED/);
  assert.match(provider, /input\.free_only === true && cloudflareFreePilotConfigured\(\)/);
  assert.match(provider, /configured\(\) \{ return cloudflareFreeRouteConfigured\(\); \}/);
  assert.match(pilot, /return cloudflareFreePilotConfigured\(\);/);
  assert.match(pilot, /free_only: true/);
  const code = [
    "import { cloudflareFreeRouteConfigured as other, cloudflareFreePilotConfigured as pilot } from './src/lib/cloudflare-zero-credit-policy.ts';",
    "console.log(JSON.stringify([other(),pilot()]));",
  ].join("\n");
  const env = {...process.env,AGI_ZERO_CREDIT_ONLY:"",
    NOVA_CHAT_FREE_ONLY:"", AGI_FREE_READONLY_PILOT_ENABLED:"true",
    CLOUDFLARE_WORKERS_AI_ENABLED:"true",
    CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED:"true",
    CLOUDFLARE_ACCOUNT_ID:"e53a864ed398f9d933c88b8a2c68c52b",
    CLOUDFLARE_WORKERS_AI_API_TOKEN:"fake-test-only"};
  const run = spawnSync(process.execPath,
    ["--experimental-strip-types","--input-type=module","--eval",code],
    {cwd:new URL("../",import.meta.url),env,encoding:"utf8",timeout:10000});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout.trim()),[false,true]);
});
