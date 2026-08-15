import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function loadSignalState() {
  try {
    return await import(new URL("../src/lib/hocker-signal-state.mjs", import.meta.url));
  } catch (error) {
    assert.fail(`Signal state policy module is missing or invalid: ${error instanceof Error ? error.message : error}`);
  }
}

test("verified percentages are deterministic ratios, never subjective estimates", async () => {
  const policy = await loadSignalState();
  assert.equal(policy.percentComplete(0, 0), 0);
  assert.equal(policy.percentComplete(1, 4), 25);
  assert.equal(policy.percentComplete(2, 3), 67);
  assert.equal(policy.percentComplete(9, 4), 100);
  assert.equal(policy.evidenceCompletion([true, false, true, true]), 75);
});

test("provider readiness separates configuration, runtime failure and verified connection", async () => {
  const policy = await loadSignalState();
  assert.deepEqual(policy.providerReadiness({ configured: false, connected: false, lastError: null }), {
    key: "pending",
    label: "Pendiente",
    percent: 0,
  });
  assert.deepEqual(policy.providerReadiness({ configured: true, connected: false, lastError: null }), {
    key: "configured",
    label: "Configurado",
    percent: 50,
  });
  assert.deepEqual(policy.providerReadiness({ configured: true, connected: false, lastError: "HTTP 404" }), {
    key: "degraded",
    label: "Con problemas",
    percent: 50,
  });
  assert.deepEqual(policy.providerReadiness({ configured: true, connected: true, lastError: null }), {
    key: "connected",
    label: "Conectado",
    percent: 100,
  });
});

test("guided GitHub chains never convert cancelled evidence into completion", async () => {
  const policy = await loadSignalState();
  assert.equal(policy.guidedGithubChainOutcome(["rejected", "rejected", "rejected"], 3), "cancelled");
  assert.equal(policy.guidedGithubChainOutcome(["executed", "completed", "executed"], 3), "completed");
  assert.equal(policy.guidedGithubChainOutcome(["executed", "execution_failed", "pending"], 3), "failed");
  assert.equal(policy.guidedGithubChainOutcome(["executed", "needs_approval"], 3), "in_progress");
});

test("Signal v1.1 UI consumes real state, progress and mobile reserve contracts", async () => {
  const [resources, pulso, shell, navigation, chat, chain, css] = await Promise.all([
    read("src/app/app/recursos/page.tsx"),
    read("src/app/app/pulso/page.tsx"),
    read("src/components/PrivateShell.tsx"),
    read("src/lib/hocker-navigation.ts"),
    read("src/components/NovaRealtimeChat.tsx"),
    read("src/components/GuidedGitHubChainCard.tsx"),
    read("src/app/globals.css"),
  ]);

  assert.match(resources, /providerReadiness/);
  assert.match(resources, /lastError/);
  assert.match(resources, /Avance verificado/);
  assert.match(resources, /Con problemas/);
  assert.doesNotMatch(resources, /Preparado/);

  assert.match(pulso, /completion_percent/);
  assert.match(pulso, /Avance verificable/);
  assert.match(pulso, /AGIs/);
  assert.match(pulso, /Apps/);

  assert.match(shell, /var\(--hko-mobile-dock-reserve\)/);
  assert.match(css, /--hko-mobile-dock-reserve:/);
  assert.match(css, /--hko-text-secondary:/);

  assert.match(navigation, /getActiveHockerSection\(pathname\)/);
  assert.match(navigation, /return section\.label/);

  assert.match(chat, /NOVA sin conexión/);
  assert.match(chat, /Reintentar/);
  assert.match(chat, /Última señal/);

  assert.match(chain, /Ejecución cancelada/);
  assert.match(chain, /ejecutados/);
  assert.match(chain, /guidedGithubChainOutcome/);
});
