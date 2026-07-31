import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("NOVA MCP drafts are validated and materialized into Owner Gate", async () => {
  const policy = await read("src/lib/mcp/mcp-policy.ts");
  const materializer = await read("src/lib/nova-mcp-action-materializer.ts");
  const chat = await read("src/app/api/nova/chat/route.ts");

  assert.match(policy, /validateDeferredMcpDraft/);
  assert.match(policy, /assertMcpToolAvailable/);
  assert.match(policy, /SENSITIVE_KEY/);
  assert.match(materializer, /enqueueAgiAction/);
  assert.match(materializer, /requires_approval: true/);
  assert.match(chat, /materializeNovaMcpActionsFromUpstream/);
});

test("mutating MCP requests cannot use the direct execute route", async () => {
  const route = await read("src/app/api/mcp/execute/route.ts");
  const worker = await read("src/lib/agi-action-execution.ts");

  assert.match(route, /MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE/);
  assert.match(worker, /executeValidatedMcpDraft/);
  assert.match(worker, /mcp_approved_execution_worker/);
});
