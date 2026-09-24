import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Vercel is a real governed executor, not a fake AI Gateway label", async () => {
  const runtime = await read("src/lib/agi-runtime-core.ts");
  const executor = await read("src/lib/vercel-runtime-executor.ts");
  const route = await read("src/app/api/agi/runtime/vercel/route.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const worker = await read("src/lib/agi-action-execution.ts");

  assert.match(runtime, /tool_key: "vercel"/);
  assert.match(runtime, /implementation_status: "executor_ready"/);
  assert.match(executor, /POST.*\/v11\/projects/);
  assert.match(executor, /VERCEL_TOKEN/);
  assert.match(route, /vercel\.create_project/);
  assert.match(worker, /pending\.tool_key === "vercel"/);
  assert.match(worker, /depends_on_action_id/);
});

test("new repositories are private by default and restricted to HockerAGI", async () => {
  const executor = await read("src/lib/github-runtime-executor.ts");
  const worker = await read("src/lib/agi-action-execution.ts");
  const route = await read("src/app/api/agi/runtime/github/route.ts");

  assert.match(executor, /create_repository/);
  assert.match(executor, /ensureHockerOrganization/);
  assert.match(worker, /visibility = \["private", "internal", "public"\]/);
  assert.match(worker, /payload\.private !== false/);
  assert.match(worker, /owner !== \(envValue\("HOCKER_GITHUB_ORG"\) \|\| "HockerAGI"\)/);
  assert.match(route, /"create_repository"/);
  assert.match(route, /private: z\.boolean\(\)\.default\(true\)/);
});

test("application delivery remains queued and Owner-Gated", async () => {
  const materializer = await read("src/lib/nova-application-delivery-materializer.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const chat = await read("src/app/api/nova/chat/route.ts");

  assert.match(materializer, /github\.create_repository/);
  assert.match(materializer, /vercel\.create_project/);
  assert.match(materializer, /depends_on_action_id/);
  assert.match(materializer, /requires_approval: true/);
  assert.match(materializer, /executed: false/);
  assert.match(router, /Vercel está bloqueado: la acción GitHub previa aún no está ejecutada/);
  assert.match(chat, /materializeNovaApplicationDeliveryFromChat/);
});

test("application delivery never stores provider secret values in the queue", async () => {
  const materializer = await read("src/lib/nova-application-delivery-materializer.ts");
  const route = await read("src/app/api/agi/runtime/vercel/route.ts");

  assert.doesNotMatch(materializer, /VERCEL_TOKEN.*payload/);
  assert.doesNotMatch(materializer, /token.*payload/i);
  assert.match(route, /no_secret_values: true/);
});


test("Chido-sensitive requests cannot be reclassified as application delivery", async () => {
  const source = await read("src/lib/nova-chat-action-drafts.ts");
  const chidoIndex = source.indexOf('if (hasAny(message, [/chido/i');
  const appIndex = source.indexOf('return "application_delivery";');
  assert.ok(chidoIndex >= 0);
  assert.ok(appIndex > chidoIndex);
});
