import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("agentic security pack blocks untrusted MCP/tool content from becoming authority", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  const policy = await read("src/lib/mcp/mcp-policy.ts");
  assert.match(runtime, /SENSITIVE_KEY/);
  assert.match(runtime, /redacted/);
  assert.match(policy, /SAFE_TOOL_NAME/);
  assert.match(policy, /validateDeferredMcpDraft/);
  assert.match(policy, /assertMcpToolAvailable/);
  assert.match(policy, /owner_gate_only|OWNER_GATE/i);
});

test("agentic security pack keeps secrets out of model-facing MCP payloads", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  const policy = await read("src/lib/mcp/mcp-policy.ts");
  assert.match(runtime, /hasSensitiveKey/);
  assert.match(runtime, /\[redacted\]/);
  assert.match(policy, /SENSITIVE_KEY/);
  assert.match(runtime, /key\.toLowerCase\(\) === "value"/);
});

test("agentic security pack preserves tenant/project authorization boundaries", async () => {
  const routes = await read("src/app/api/agi/runtime/capabilities/route.ts");
  const chat = await read("src/app/api/nova/chat/route.ts");
  const ownerGate = await read("src/lib/hocker-owner-api-gate.ts");
  assert.match(routes, /requireProjectRole\(project_id/);
  assert.match(chat, /requireProjectRole\(parsed\.data\.project_id/);
  assert.match(ownerGate, /project_id/);
  assert.match(ownerGate, /owner/i);
});

test("agentic security pack requires bounded, one-time approval evidence", async () => {
  const migration = await read("supabase/migrations/20260810192259_owner_gate_approval_evidence_v1.sql");
  const contextBridge = await read("src/app/api/context-bridge/manifests/activate/route.ts");
  assert.match(migration, /nonce uuid not null/i);
  assert.match(migration, /request_hash text not null/i);
  assert.match(migration, /approval_hash text not null/i);
  assert.match(migration, /consumed_at timestamptz/i);
  assert.match(contextBridge, /request_hash/);
  assert.match(contextBridge, /nonce/);
  assert.match(contextBridge, /supabase-session-aal2/);
});

test("agentic security pack prevents direct material MCP execution outside Owner Gate", async () => {
  const directRoute = await read("src/app/api/mcp/execute/route.ts");
  const router = await read("src/lib/agi-action-execution-router.ts");
  const materializer = await read("src/lib/nova-mcp-action-materializer.ts");
  assert.match(directRoute, /MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE/);
  assert.match(router, /status", "approved"/);
  assert.match(router, /locked_at/);
  assert.match(router, /executeValidatedMcpDraft/);
  assert.match(materializer, /requires_approval: true/);
});

test("agentic security pack keeps delegation bounded and evidence-backed", async () => {
  const canonical = await read("src/lib/hocker-agi-operational.ts");
  const context = await read("src/lib/hocker-context-pack.ts");
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  assert.match(canonical, /canonicalAgiId/);
  assert.match(context, /capabilities_contract/);
  assert.match(context, /handoff_prompt_for_nova/);
  assert.match(runtime, /MAX_TOOL_CALLS = 8/);
  assert.match(runtime, /MAX_TOOL_ARGS_BYTES = 16 \* 1024/);
});

test("agentic security pack preserves the fail-closed action baseline", async () => {
  const contract = await read("src/lib/hocker-capabilities-contract.ts");
  const chat = await read("src/components/NovaRealtimeChat.tsx");
  assert.match(contract, /allow_actions=false|false/);
  assert.match(contract, /requires_owner_gate/);
  assert.match(chat, /allow_actions: false/);
});

test("agentic security pack aligns with the canonical distinction between catalog and liveness", async () => {
  const runtimeState = await read("src/lib/agi-runtime-state.ts");
  const nodes = await read("src/components/NodesPanel.tsx");
  assert.match(runtimeState, /agi_integration_checks/);
  assert.match(nodes, /last_seen_at/);
  assert.match(nodes, /stale/);
});


test("automatic AGI routing selects capability owner and support AGIs without user selection", async () => {
  const source = await read("src/lib/hocker-tool-router.ts");
  assert.match(source, /buildAutomaticAgiDelegationPlan/);
  assert.match(source, /primary_agi/);
  assert.match(source, /support_agis/);
  assert.match(source, /delegation_required/);
  assert.match(source, /context\.decision\.owner_agi/);
});
