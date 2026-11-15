import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("Vercel remains fail-closed with actionable HTTP diagnostics and no secret exposure", async () => {
  const [continuity, runtime, ui] = await Promise.all([
    read("src/lib/project-continuity.ts"),
    read("src/lib/vercel-runtime-executor.ts"),
    read("src/app/owner/context-bridge/ContextBridgeActivationPanel.tsx"),
  ]);
  assert.match(runtime, /failure\.httpStatus = response\.status/);
  assert.match(runtime, /export async function getVercelDeploymentById/);
  assert.match(runtime, /\/v13\/deployments\//);
  assert.match(continuity, /hasVercelRuntimeToken\(\)/);
  assert.match(continuity, /vercel_rest_http_401/);
  assert.match(continuity, /vercel_rest_http_403/);
  assert.match(continuity, /vercel_production_main_sha_mismatch/);
  assert.match(continuity, /status: verified \? "verified" : "partial"/);
  assert.match(continuity, /listVercelDeployments/);
  assert.match(continuity, /getVercelDeploymentById/);
  assert.match(continuity, /latestProduction\.state !== "READY"/);
  assert.match(continuity, /row\) => row\.target === "production"/);
  assert.match(continuity, /main\.object\?\.sha/);
  assert.match(continuity, /vercel_rest_by_id_and_github_main/);
  assert.match(continuity, /record\.id !== candidateId/);
  assert.match(continuity, /s\.context === "Vercel" && s\.state === "success"/);
  assert.match(continuity, /target !== "production"/);
  assert.match(continuity, /gitRef !== "main"/);
  assert.match(continuity, /sha !== expectedMainSha/);
  assert.match(ui, /Vercel rechazó el token de Production/);
  assert.match(ui, /Vercel denegó permisos al token de Production/);
  assert.doesNotMatch(continuity, /VERCEL_TOKEN\s*=/);
  assert.doesNotMatch(continuity, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(runtime.slice(runtime.indexOf("export async function getVercelDeploymentById"),runtime.indexOf("export async function getVercelDeploymentLogs")),/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
});

test("GitHub Vercel success does not pass without authenticated Vercel REST verification", async () => {
  const code=await read("src/lib/project-continuity.ts");
  const block=code.slice(code.indexOf("async function readVercelProductionEvidence"),code.indexOf("async function reconcileVercel"));
  assert.match(block,/getVercelDeploymentById\(/);
  assert.match(block,/await verifyReadyDeployment\(/);
  assert.doesNotMatch(block,/candidateId\) return \{ deployment: [^n]/);
  assert.match(block,/if \(!candidateId\) return \{ deployment: null/);
});
