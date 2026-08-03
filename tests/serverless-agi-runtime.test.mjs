import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("worker console uses Hocker ONE serverless execution instead of Railway", async () => {
  const route = await read("src/app/api/agi/workers/route.ts");
  assert.match(route, /runServerlessAgiWorkerOnce/);
  assert.match(route, /createServerlessAgiTask/);
  assert.match(route, /recoverStaleServerlessAgiTasks/);
  assert.doesNotMatch(route, /NOVA_WORKERS_NOT_CONFIGURED|novaRequest\(/);
});

test("NOVA chat falls back to real serverless inference", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  assert.match(route, /runServerlessNovaChat/);
  assert.match(route, /NOVA_UPSTREAM_NOT_CONFIGURED/);
  assert.match(route, /NOVA_UPSTREAM_TIMEOUT/);
  assert.doesNotMatch(route, /NOVA no está configurada en el entorno de producción/);
});

test("verified worker evidence requires provider, model, worker and hashes", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /kind: "verified_model_completion"/);
  assert.match(runtime, /provider: completion\.provider/);
  assert.match(runtime, /model: completion\.model/);
  assert.match(runtime, /worker_id: workerId/);
  assert.match(runtime, /input_sha256: inputHash/);
  assert.match(runtime, /output_sha256: resultHash/);
  assert.match(runtime, /external_writes_executed: false/);
});

test("planned profiles remain fail-closed", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(runtime, /AGI_PROFILE_NOT_OPERATIONAL/);
  assert.match(runtime, /status === "planned"/);
});
