import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified NOVA MCP loop reuses the authoritative Hocker registry", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  assert.match(runtime, /getMcpRegistry/);
  assert.match(runtime, /isReadOnlyMcpTool/);
  assert.match(runtime, /registry\.executeTool/);
  assert.match(runtime, /MAX_TOOL_CALLS = 8/);
  assert.match(runtime, /MAX_TOOL_ARGS_BYTES = 16 \* 1024/);
  assert.match(runtime, /MCP_MUTATION_REQUIRES_HOCKER_ONE_OWNER_GATE/);
  assert.match(runtime, /execution_target: "hocker\.one\.owner-gate"/);
});

test("MCP tool results and Vercel environment values are sanitized before inference", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  assert.match(runtime, /SENSITIVE_KEY/);
  assert.match(runtime, /"\[redacted\]"/);
  assert.match(runtime, /env\\\.list\|list_env\|list_environment_variables/);
  assert.match(runtime, /key\.toLowerCase\(\) === "value"/);
  assert.doesNotMatch(runtime, /process\.env\[[^\]]+\].*sanitized_payload/s);
});

test("unified chat executes at most one read-tool round and defers mutations", async () => {
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  assert.match(runtime, /parseAgiMcpEnvelope/);
  assert.match(runtime, /executeAgiMcpToolCalls/);
  assert.match(runtime, /collectAgiMcpDeferredActions/);
  assert.match(runtime, /buildAgiMcpResultBlock/);
  assert.match(runtime, /deferred_actions: deferredActions/);
  assert.match(runtime, /owner_gate_only/);
  const executeCount = (runtime.match(/executeAgiMcpToolCalls\(/g) ?? []).length;
  assert.equal(executeCount, 1);
});

test("raw MCP tool-call JSON is never used as a public NOVA reply", async () => {
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  assert.match(runtime, /function publicReplyFromToolEnvelope/);
  assert.match(runtime, /tool_call_count > 0/);
  assert.match(runtime, /phase === "post-tool"/);
  assert.match(runtime, /No ejecuté una segunda ronda automáticamente/);
  assert.doesNotMatch(runtime, /finalReply\s*=\s*safeText\(followUpEnvelope\.reply\s*\|\|\s*finalCompletion\.text\)/);
});

test("Hocker One is primary and dedicated NOVA cannot succeed without durable fallback import", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  const unifiedCall = route.indexOf("runToolEnabledUnifiedNovaChat");
  const dedicatedFetch = route.indexOf('fetch(`${baseUrl}/api/v1/chat`');
  const durableImport = route.indexOf("persistDedicatedNovaFallbackTurn");
  assert.ok(unifiedCall >= 0);
  assert.ok(dedicatedFetch > unifiedCall);
  assert.ok(durableImport >= 0);
  assert.match(route, /memory_import_failed/);
  assert.match(route, /fallback_memory_imported: true/);
});

test("same thread and request trace identify a turn across runtime fallback", async () => {
  const route = await read("src/app/api/nova/chat/route.ts");
  const store = await read("src/lib/agi-session-store.ts");
  assert.match(route, /const requestThreadId = parsed\.data\.thread_id \?\? randomUUID\(\)/);
  assert.match(route, /const requestTraceId = randomUUID\(\)/);
  assert.match(route, /thread_id: requestThreadId/);
  assert.match(route, /trace_id: requestTraceId/);
  assert.match(route, /request_trace_id: requestTraceId/);
  assert.match(store, /`\$\{input\.request_trace_id\}:user`/);
  assert.match(store, /`\$\{input\.request_trace_id\}:assistant`/);
});
