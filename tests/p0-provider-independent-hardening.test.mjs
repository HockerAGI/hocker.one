import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Memory Mirror prompt states only the evidence actually filtered", async () => {
  const source = await read("src/lib/agi-context-builder.ts");
  assert.match(source, /Memory Mirror seguro, activo y aplicable/);
  assert.doesNotMatch(source, /Memory Mirror aprobado y aplicable/);
  assert.match(source, /\.eq\("active", true\)/);
  assert.match(source, /\.eq\("safety_status", "safe"\)/);
});

test("legacy NOVA sync cannot invalidate an already durable unified turn", async () => {
  const source = await read("src/lib/unified-nova-chat-runtime.ts");
  const assistantPersist = source.indexOf("const assistantMessage = await appendAgiMessage");
  const syncAttempt = source.indexOf("legacySync = await syncAgiTurnToLegacyNova");
  const pendingReconcile = source.indexOf('state: "pending_reconcile"');

  assert.ok(assistantPersist >= 0, "assistant must be persisted in canonical store");
  assert.ok(syncAttempt > assistantPersist, "legacy sync must happen after canonical assistant persistence");
  assert.ok(pendingReconcile > syncAttempt, "legacy sync failure must become pending reconcile");
  assert.match(source, /canonical_persistence_intact: true/);
  assert.match(source, /The unified store is canonical/);
});

test("MCP read tools are allowlisted and sensitive GitHub paths are blocked before execution", async () => {
  const policy = await read("src/lib/mcp/mcp-policy.ts");
  const runtime = await read("src/lib/agi-mcp-runtime.ts");

  assert.match(policy, /export function assertMcpReadToolPolicy/);
  assert.match(policy, /SENSITIVE_GITHUB_READ_PATH/);
  assert.match(policy, /HOCKER_GITHUB_ALLOWED_REPOS/);
  assert.match(policy, /HockerAGI\/punto\.g/);
  assert.match(policy, /Path sensible bloqueado para lectura AGI/);
  assert.match(runtime, /assertMcpReadToolPolicy\(call\.provider, call\.tool, call\.args\)/);
  assert.match(runtime, /MCP_READ_BLOCKED_BY_POLICY/);
});

test("MCP results redact free-form credentials and never return raw connector errors to the model", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");

  assert.match(runtime, /redacted-private-key/);
  assert.match(runtime, /redacted-github-token/);
  assert.match(runtime, /redacted-jwt/);
  assert.match(runtime, /MCP_TOOL_EXECUTION_FAILED/);
  assert.doesNotMatch(runtime, /error instanceof Error \? error\.message\.slice\(0, 300\)/);
});

test("Gemini direct auth stays in headers rather than the request URL", async () => {
  const source = await read("src/lib/agi-model-providers/gemini.ts");
  assert.match(source, /"x-goog-api-key": apiKey\(\)/);
  assert.doesNotMatch(source, /generateContent\?key=/);
});

test("dedicated NOVA fallback linking uses exact trace IDs rather than content heuristics", async () => {
  const migration = await read("supabase/migrations/20260816073300_link_dedicated_nova_fallback.sql");

  assert.match(migration, /request_trace_id/);
  assert.match(migration, /agi_messages_link_dedicated_nova_fallback/);
  assert.match(migration, /external_fallback_linked/);
  assert.match(migration, /m\.meta->>'trace_id'/);
  assert.doesNotMatch(migration, /where\s+m\.content\s*=\s*p_/i);
});
