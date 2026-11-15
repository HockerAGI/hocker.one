import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner context screen exposes current proof separately from historical COMPLETE snapshot", async () => {
  const [page, panel, coverage] = await Promise.all([
    read("src/app/owner/context-bridge/page.tsx"),
    read("src/app/owner/context-bridge/ContextBridgeActivationPanel.tsx"),
    read("src/lib/context-bridge-coverage.ts"),
  ]);
  const auth = page.indexOf('await requireOwnerAal2Page("/owner/context-bridge")');
  const preflight = page.indexOf('await getContextBridgeCurrentProofs("hocker-one")');
  assert.ok(auth >= 0 && preflight > auth, "Read-only evidence must be queried only after Owner AAL2");
  assert.match(page, /<ContextBridgeActivationPanel currentProofs=\{currentProofs\}/);
  assert.match(page, /Mostrar cobertura del manifiesto histórico/);
  assert.match(page, /legacyActiveWithoutApproval/);
  assert.match(panel, /deriveProviderCoverageStatus/);
  assert.match(panel, /checkpointObservedAt: proof\.checkpointObservedAt/);
  assert.match(panel, /currentCoverageComplete/);
  assert.match(panel, /&& currentCoverageComplete;/);
  assert.match(panel, /disabled=\{!canSubmit \|\| loading\}/);
  assert.match(panel, /if \(!canSubmit \|\| !currentProofs\) return;/);
  assert.match(panel, /window\.setInterval\(refreshClock, 15_000\)/);
  assert.match(panel, /document\.addEventListener\("visibilitychange"/);
  assert.match(panel, /window\.clearInterval\(interval\)/);
  assert.match(panel, /cutoffNow = Date\.now\(\) - freshnessHours/);
  assert.match(panel, /completeAtClick/);
  assert.match(panel, /La evidencia venció durante esta sesión/);
  assert.match(panel, /currentProofs \? `\$\{completeProviders\}\/6 vigentes` : "Sin verificar"/);
  assert.match(panel, /No aumentes el umbral de antigüedad/);
  assert.match(coverage, /checkpointTime < staleBefore/);
  assert.match(coverage, /freshCapabilities/);
  assert.doesNotMatch(panel, /setResult\(\{\s*ok: true/);
});

test("Current coverage uses same newest-per-source/provider selection and evidence capability criteria as activation", async () => {
  const contract = await read("src/lib/context-bridge.ts");
  const [preflight, create] = [
    contract.slice(contract.indexOf("export async function getContextBridgeCurrentProofs("),
      contract.indexOf("export async function getActiveContextBridgeManifest(")),
    contract.slice(contract.indexOf("export async function createContextBridgeManifest("),
      contract.indexOf("export async function getContextBridgeCurrentProofs(")),
  ];
  assert.match(preflight, /context_bridge_sources/);
  assert.match(preflight, /context_bridge_checkpoints/);
  assert.match(preflight, /context_bridge_capabilities/);
  assert.match(preflight, /\.eq\("project_id", projectId\)/);
  assert.match(preflight, /\.order\("observed_at", \{ ascending: false \}\)/);
  assert.match(preflight, /latestBySource/);
  assert.match(preflight, /source\.provider === provider/);
  assert.match(preflight, /capability\.provider === provider/);
  assert.match(create, /source\.provider === provider/);
  assert.match(create, /capability\.provider === provider/);
  assert.doesNotMatch(preflight, /\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
  assert.doesNotMatch(preflight, /select\("\*"\)|raw_content|transcript|messages/);
  assert.match(preflight, /CONTEXT_BRIDGE_READINESS_UNAVAILABLE/);
});

test("Activation still depends on server-side Owner AAL2 and one-time approval", async () => {
  const route = await read("src/app/api/context-bridge/manifests/activate/route.ts");
  assert.match(route, /requireOwnerAal2Api\(\)/);
  assert.match(route, /record_owner_gate_approval/);
  assert.match(route, /activate_context_bridge_manifest_v2/);
  assert.match(route, /if \(!result\.complete\)/);
});
