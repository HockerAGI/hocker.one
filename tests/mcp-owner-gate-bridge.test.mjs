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
  assert.match(chat, /requireProjectRole\(parsed\.data\.project_id, \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(chat, /requireProjectRole\(chatCtx\.project_id, \["owner", "admin", "operator"\]\)/);
  assert.match(chat, /allow_actions: Boolean\(upstreamActionActorId\)/);
  assert.match(chat, /mcp_owner_gate/);
  assert.match(chat, /nova_mcp_actions_waiting_owner_gate/);
});

test("mutating MCP requests require queue, approval, lock and evidence", async () => {
  const directRoute = await read("src/app/api/mcp/execute/route.ts");
  const executeRoute = await read("src/app/api/agi/runtime/actions/execute/route.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const approvals = await read("src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx");

  assert.match(directRoute, /MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE/);
  assert.match(executeRoute, /executeApprovedAgiActionUniversal/);
  assert.match(router, /\.eq\("status", "approved"\)/);
  assert.match(router, /\.is\("locked_at", null\)/);
  assert.match(router, /executeValidatedMcpDraft/);
  assert.match(router, /mcp_approved_execution_worker_1\.0/);
  assert.match(router, /execution_result/);
  assert.match(router, /return executeApprovedAgiAction\(params\)/);
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


test("dynamic MCP providers are governed by an HTTPS host allowlist", async () => {
  const source = await read("src/lib/mcp/mcp-registry.ts");
  assert.match(source, /HOCKER_MCP_PROVIDERS_JSON/);
  assert.match(source, /HOCKER_MCP_ALLOWED_HOSTS/);
  assert.match(source, /parsedUrl\.protocol !== "https:"/);
  assert.match(source, /new McpClient/);
  assert.match(source, /type: "custom"/);
});
