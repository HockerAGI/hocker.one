import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

async function loadGate(overrides = {}) {
  const compiled = ts.transpileModule(await read("src/lib/nova-agi-delegation-gate.ts"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  const state = { workerReads: 0, rootWrites: [], ownerChecks: 0 };
  const existingRuns = new Map();
  const worker = overrides.worker ?? {
    ready: true, schema_ready: true, provider_configured: true,
    last_verified_run: {
      status: "completed",
      provider: "vercel-ai-gateway",
      worker_id: "hocker-one-serverless:iad1:123",
      finished_at: new Date().toISOString(),
      result_hash: "a".repeat(64),
      evidence: [{ kind: "verified_model_completion", worker_id: "hocker-one-serverless:iad1:123", external_writes_executed: false }],
    },
  };
  const client = {
    from(table) {
      assert.equal(table, "agi_runs");
      return {
        select() {
          return {
            eq(key, value) {
              assert.equal(key, "id");
              return { eq(projectKey, projectValue) {
                assert.equal(projectKey, "project_id");
                assert.equal(projectValue, "hocker-one");
                return { async maybeSingle() { return { data: existingRuns.get(value) ?? null, error: null }; } };
              } };
            },
          };
        },
        insert(row) {
          state.rootWrites.push(row);
          existingRuns.set(row.id, row);
          return { select() { return { async single() { return { data: { id: row.id }, error: null }; } }; } };
        },
      };
    },
  };
  vm.runInNewContext(compiled, {
    exports, module: { exports }, process: { env: { AGI_DELEGATION_DISPATCH_ENABLED: overrides.enabled ? "true" : "false" } },
    require(name) {
      if (name === "node:crypto") return { createHash };
      if (name === "@/lib/cloudflare-zero-credit-policy") return { cloudflareZeroCreditMode: () => Boolean(overrides.zeroCredit) };
      if (name === "@/lib/serverless-agi-runtime") return {
        serverlessGatewayConfigured: () => overrides.providerConfigured !== false,
        getServerlessAgiWorkerStatus: async () => { state.workerReads++; return worker; },
      };
      if (name === "@/lib/supabase-admin") return { createAdminSupabase: () => client };
      if (name === "@/lib/owner-session-gate") return {
        requireOwnerAal2Api: async () => { state.ownerChecks++; return { ok: overrides.ownerAal2 !== false }; },
      };
      throw new Error("Unexpected dependency " + name);
    },
  });
  return { gate: exports, state, existingRuns };
}

test("disabled or zero-credit delegate cannot read a worker, insert a run, or dispatch", async () => {
  for (const options of [{ enabled: false }, { enabled: true, zeroCredit: true }]) {
    const { gate, state } = await loadGate(options);
    assert.equal(gate.novaDelegationDispatchConfigured(), false);
    const result = await gate.inspectNovaDelegationReadiness("hocker-one");
    assert.equal(result.ready, false);
    assert.equal(result.reason, "AGI_DELEGATION_DISPATCH_DISABLED");
    assert.equal(state.workerReads, 0);
    assert.equal(state.rootWrites.length, 0);
  }
});

test("AAL2 and actual recent completed specialist-worker proof are mandatory", async () => {
  const ownerDenied = await loadGate({ enabled: true, ownerAal2: false });
  const denied = await ownerDenied.gate.inspectNovaDelegationReadiness("hocker-one");
  assert.equal(denied.ready, false);
  assert.equal(denied.reason, "AGI_DELEGATION_OWNER_AAL2_REQUIRED");
  assert.equal(ownerDenied.state.workerReads, 0);

  const allowed = await loadGate({ enabled: true });
  assert.equal((await allowed.gate.inspectNovaDelegationReadiness("hocker-one")).ready, true);
  const staleWorker = await loadGate({ enabled: true, worker: {
    ready: true, schema_ready: true, provider_configured: true,
    last_verified_run: {
      status: "completed", provider: "hocker-model-router",
      worker_id: "hocker-one-eval:nova",
      finished_at: "2026-08-01T00:00:00Z",
      result_hash: "a".repeat(64), evidence: [],
    },
  } });
  const blocked = await staleWorker.gate.inspectNovaDelegationReadiness("hocker-one");
  assert.equal(blocked.ready, false);
  assert.equal(blocked.reason, "AGI_DELEGATION_NO_RECENT_REAL_WORKER_PROOF");
});

test("NOVA true provider completion creates one existing-table parent run with hashed, non-raw evidence", async () => {
  const { gate, state } = await loadGate({ enabled: true });
  const trace = randomUUID();
  const session = randomUUID(), message = randomUUID();
  const completion = {
    provider: "cloudflare-workers-ai", model: "@cf/example",
    text: "", tool_calls: [{ id: "t1", name: "hocker__agi__delegate", arguments: { subject: "research" } }],
  };
  const params = {
    project_id: "hocker-one", trace_id: trace, session_id: session,
    user_message_id: message, completion,
  };
  const runId = await gate.persistVerifiedNovaDelegationParent(params);
  assert.equal(runId, trace);
  assert.equal(state.rootWrites.length, 1);
  const row = state.rootWrites[0];
  assert.equal(row.agi_id, "nova");
  assert.equal(row.status, "completed");
  assert.equal(row.provider, completion.provider);
  assert.equal(row.model, completion.model);
  assert.equal(row.worker_id, "hocker-one-unified-nova-chat");
  assert.equal(row.input.session_id, session);
  assert.equal(row.input.user_message_id, message);
  assert.equal(row.evidence[0].kind, "verified_nova_chat_model_completion");
  assert.equal(row.output.verified_execution, true);
  assert.equal(row.output.external_writes_executed, false);
  assert.equal(row.output.completion_sha256.length, 64);
  assert.equal(row.result_hash.length, 64);
  assert.equal(JSON.stringify(row).includes('"subject":"research"'), false, "never persist raw tool args");
  assert.equal(await gate.persistVerifiedNovaDelegationParent(params), runId);
  assert.equal(state.rootWrites.length, 1, "same real trace must not create duplicate parent runs");
  await assert.rejects(() => gate.persistVerifiedNovaDelegationParent({
    ...params, completion: { ...completion, model: "different-model" },
  }), /TRACE_COLLISION/);
});

test("NOVA genuine parent lineage is bound to the tool call and delegated task, not a synthetic run", async () => {
  const [chat, runtime, tasks, owner] = await Promise.all([
    read("src/lib/unified-nova-chat-runtime.ts"),
    read("src/lib/agi-mcp-runtime.ts"),
    read("src/lib/serverless-agi-runtime.ts"),
    read("src/lib/nova-agi-delegation-gate.ts"),
  ]);
  assert.match(chat, /const first = await completeAgi\(/);
  assert.match(chat, /const delegationRequested = resolvedCalls\.some/);
  assert.match(chat, /inspectNovaDelegationReadiness\(params\.project_id, params\.oidc_token\)/);
  assert.match(chat, /persistVerifiedNovaDelegationParent\(/);
  assert.match(chat, /completion: first/);
  assert.match(chat, /parent_run_id: verifiedNovaParentRunId/);
  assert.doesNotMatch(chat, /parent_run_id: null/);
  assert.match(runtime, /AGI_DELEGATION_OWNER_ACTION_REQUIRED/);
  assert.match(runtime, /delegation_block_reason/);
  assert.match(runtime, /inspectNovaDelegationReadiness\(options\.project_id, options\.oidc_token\)/);
  assert.match(runtime, /parent_run_id: parentRunId, delegation_depth: depth \+ 1/);
  assert.match(runtime, /tool\.qualified_name !== "agi\.delegate"/);
  assert.match(tasks, /parent_run_id: parentRunId/);
  assert.match(tasks, /if \(delegationDepth > 0 && !parentRunId\)/);
  assert.match(owner, /requireOwnerAal2Api\(projectId\)/);
  assert.match(owner, /VERIFIED_WORKER_PREFIX = "hocker-one-serverless:"/);
});
