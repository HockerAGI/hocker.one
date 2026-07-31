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
  assert.match(chat, /mcp_owner_gate/);
  assert.match(chat, /nova_mcp_actions_waiting_owner_gate/);
});

test("mutating MCP requests require queue, approval, lock and evidence", async () => {
  const route = await read("src/app/api/mcp/execute/route.ts");
  const worker = await read("src/lib/agi-action-execution.ts");
  const approvals = await read("src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx");

  assert.match(route, /MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE/);
  assert.match(worker, /claimApprovedQueueItem/);
  assert.match(worker, /executeValidatedMcpDraft/);
  assert.match(worker, /mcp_approved_execution_worker_1\.0/);
  assert.match(worker, /execution_result/);
  assert.match(approvals, /toolKey === "mcp" && actionType === "mcp\.execute"/);
  assert.match(approvals, /Aprobar y ejecutar/);
});

test("CI remains read-only and cannot patch its own source", async () => {
  const ci = await read(".github/workflows/ci.yml");

  assert.match(ci, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(ci, /contents: write/);
  assert.doesNotMatch(ci, /Apply complete MCP Owner Gate bridge/);
  await assert.rejects(read(".github/workflows/apply-hocker-mcp-owner-gate-bridge.yml"));
  await assert.rejects(read(".github/workflows/repair-hocker-mcp-owner-gate-bridge.yml"));
});
