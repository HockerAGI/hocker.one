import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("zero-credit mode stops serverless gateway before claiming queued tasks", async () => {
  const code = await read("src/lib/serverless-agi-runtime.ts");
  assert.match(code, /if \(cloudflareZeroCreditMode\(\)\) return false/);
  assert.match(code, /ZERO_CREDIT_SERVERLESS_GATEWAY_DISABLED/);
  assert.match(code, /ZERO_CREDIT_SERVERLESS_WORKER_PAUSED/);
  assert.ok(code.indexOf("ZERO_CREDIT_SERVERLESS_WORKER_PAUSED") <
    code.indexOf('"claim_next_agi_task"'));
});

test("zero-credit NOVA cannot fall back to uncertified dedicated AGI provider", async () => {
  const code = await read("src/app/api/nova/chat/route.ts");
  assert.match(code, /cloudflare_free_only: true/);
  assert.match(code, /dedicated_fallback_used: false/);
  assert.ok(code.indexOf("if (cloudflareZeroCreditMode()) {") <
    code.indexOf("if (!baseUrl || !key) {"));
});
