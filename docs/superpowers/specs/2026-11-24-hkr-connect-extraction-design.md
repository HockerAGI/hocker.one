# HKR Connect Extraction Design

Status: approved direction / documentation-only extraction gate  
Evidence cut: 2026-11-24 America/Tijuana  
Source baseline:
- HockerAGI/hocker.one main: f79288d17d29ee10afa5afcb14e209e725f1c868
- HockerAGI/nova.agi main observed: 8f52a0ad6402085c8a877418996c304491bacefc
- HockerAGI/hocker-node-agent main observed: 6401aad71a5552a6e331d83d8b0b4ab62a967aa2

Mutable runtime/provider facts must always be re-queried before release or credential changes.

## Intent

Build HKR Connect as an independent, multi-tenant AI-to-tools product without breaking, renaming, moving, or weakening the existing HOCKER control plane.

HKR Connect must reuse proven contracts and security ideas from Hocker One and hocker-node-agent while avoiding a fork of either repository. Hocker One remains the internal control plane. NOVA remains an optional consumer/adapter, not a mandatory dependency of the commercial product.

## Non-negotiable constraints

1. No direct writes to existing product `main` branches during extraction.
2. No production deployment, Supabase DDL, credential mutation, provider activation, or global `allow_actions` change as part of extraction.
3. Existing Hocker One Owner Gate, Context Bridge, AGI runtime, NOVA, product registries, and Node Agent stay operationally unchanged.
4. New HKR code must live in a separate private repository; do not create `packages/hkr-*` inside Hocker One as a shortcut.
5. Product authorization must be tenant/workspace scoped. HOCKER owner identity, HOCKER service-role credentials, and fixed HOCKER repo lists must never become customer authorization.
6. The default product posture is fail-closed.
7. Arbitrary shell is not a normal HKR tool. Higher-level bounded workspace commands are preferred.
8. Provider/tool annotations are hints only. Server-side authorization remains authoritative.
9. No raw chats, secrets, auth headers, private keys, or unrestricted service-role keys in HKR Proof or shared continuity records.
10. First Alpha is non-financial, non-gambling, non-KYC and non-surveillance.

## Approaches considered

### A. Fork Hocker One and rename it

Rejected. It would copy NOVA/AGI/product-specific state, UI, credentials, migrations, HOCKER tenant assumptions and certification logic into a commercial product. Future fixes would diverge and every Hocker One change would create merge debt.

### B. Extract shared packages inside Hocker One first

Deferred. This could eventually reduce duplicate code, but changing live Hocker One boundaries before HKR contracts are stable raises regression risk. It also couples the first HKR release to Hocker One deployment cadence.

### C. Clean independent HKR repository with contract-level reuse

Selected. Reuse algorithms, schemas, invariants and tests that are product-neutral; rebuild adapters where HOCKER-specific authorization, storage, providers or naming are embedded. Hocker One can integrate with HKR later through a versioned adapter after HKR proves stable.

## Target product boundary

```text
ChatGPT / Codex / other MCP clients
                 |
          HKR MCP Server
                 |
       +---------+---------+
       |         |         |
    HKR Work  HKR Control HKR Proof
       |         |         |
       +---------+---------+
                 |
          Provider adapters
          /              \
     GitHub           HKR Agent
                        |
               local workspace
          VS Code / Codespaces / Xcode
```

NOVA may later consume the same HKR MCP surface. NOVA is not embedded in HKR Core.

## Current external platform requirements

OpenAI's plugin/MCP documentation requires a real MCP server endpoint for custom plugins and server-side authorization on every request. For implementation, HKR follows the current official MCP TypeScript SDK v2: `@modelcontextprotocol/server` for the server surface and `@modelcontextprotocol/node` when a Node HTTP adapter is needed. MCP SDK v2 is the stable line for the 2026-07-28 protocol; older examples that use the v1 umbrella package `@modelcontextprotocol/sdk` are compatibility/reference material, not the HKR implementation baseline. The target exposes Streamable HTTP (normally `/mcp`).

References:
- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/api/docs/guides/custom-mcp-server
- https://developers.openai.com/plugins/deploy/connect-chatgpt
- https://ts.sdk.modelcontextprotocol.io/v2/
- https://ts.sdk.modelcontextprotocol.io/v2/server/

The existing Hocker One `/api/mcp/execute` route remains an internal HOCKER API and is not promoted as the public HKR MCP endpoint.

## Target repository shape

```text
hkr.connect/
  apps/
    mcp-server/
    agent/
  packages/
    protocol/
    control/
    proof/
    providers-github/
    storage/
  tests/
    fixtures/
  docs/
    architecture/
    operations/
    superpowers/
```

Alpha 0 only needs `packages/protocol`, `packages/control`, `packages/proof`, `apps/mcp-server`, and deterministic test fixtures. Local Agent work follows as a separate milestone after the remote MCP contract is green.

## Extraction map — Hocker One

### REUSE as product-neutral contract or algorithm

| Source | Reuse | HKR destination |
| --- | --- | --- |
| `src/lib/hocker-operating-loop/types.ts` | Work state names, research provenance shape, execution candidate concepts, approval binding concepts | `packages/protocol` |
| `src/lib/hocker-operating-loop/state.ts` | Explicit state transition validation | `packages/protocol` |
| `src/lib/hocker-operating-loop/hash.ts` | Canonical JSON + deterministic SHA-256 | `packages/proof` |
| `tests/hocker-operating-loop-contracts.test.mjs` | Regression ideas for state/candidate/provenance/hash | HKR protocol/proof tests |
| `src/lib/agi-queue-lock.ts` | Fail-closed “one conflicting material flow at a time” invariant | `packages/control` |
| `src/lib/agi-action-execution-router.ts` | approved-state claim, lock, bounded attempts, execution result/error persistence | `packages/control` |
| `supabase/migrations/20260524_091700_agi_action_queue_lock_idempotency.sql` | idempotency key, lock metadata, attempts and rollback fields | generic HKR schema |
| `supabase/migrations/20260810192259_owner_gate_approval_evidence_v1.sql` | scoped, expiring, one-use approval evidence pattern | HKR approval ledger |
| `src/lib/github-runtime-executor.ts` | exact-SHA reads, branch/file/PR sequence, no direct main mutation | `packages/providers-github` |
| `src/lib/github-repository-governance.ts` | exact allowlist principle | workspace policy |
| `src/lib/nova-mcp-action-materializer.ts` | preflight all writes before queue insertion; ordered dependencies | generic action materializer |
| `tests/mcp-owner-gate-bridge.test.mjs` | read/write separation and queue enforcement tests | HKR MCP/control tests |

### ADAPT, do not copy literally

| Source | Reason |
| --- | --- |
| `src/lib/hocker-operating-loop/store.ts` | persistence is tied to Hocker Supabase RPCs and HOCKER project roles |
| `supabase/migrations/20260918081119_20260913170000_hocker_operating_loop_work_sessions.sql` | references `projects`, `agi_runs`, `agi_tasks`, `agi_action_queue`, `auth.users` |
| `src/lib/context-bridge.ts` | valuable provenance/hash/secret-rejection ideas but fixed HOCKER providers and project semantics |
| `supabase/migrations/20260808215327_context_bridge_v1.sql` | storage model is HOCKER-specific |
| `src/lib/mcp/mcp-registry.ts` | useful provider discovery/allowlist patterns, but registry owns HOCKER providers and env vars |
| `src/lib/mcp/mcp-policy.ts` | useful validation ideas, but HOCKER repo/owner/path defaults and provider categories are embedded |
| `src/lib/github-runtime-identity.ts` | GitHub App short-lived identity is useful, but current configuration is singleton env-based rather than tenant installation based |
| `src/lib/nova-github-proposal.ts` | exact SHA + bounded file proposal is reusable, but NOVA naming and three-repo scope are not |
| `src/lib/agi-action-execution.ts` | execution and lock patterns useful; AGI/Vercel/Hocker-specific dispatch must be removed |

### DO NOT COPY

- NOVA chat/runtime UI and prompts.
- 16-AGI canon, scoring/certification and AGI assignment tables.
- HOCKER app registry/public catalog/dashboard.
- HOCKER Owner-specific UI.
- HOCKER production secrets/env names as customer contract.
- Chido/PUNTO.G/Hocker Ads business logic.
- Hocker One Supabase service-role key.
- historical release evidence as if it certified HKR.

## Extraction map — hocker-node-agent

### REUSE as security invariant

| Source | Reuse |
| --- | --- |
| `src/lib/sandbox.ts` | root confinement, realpath/symlink checks, byte/time/output bounds, stripped child env |
| `src/config.ts` | loopback default, explicit LAN opt-in, distinct secrets, no filesystem root sandbox |
| `src/lib/signature.ts` | deterministic signed command envelope + TTL + timing-safe compare |
| `src/heartbeat-readiness.ts` | readiness based on fresh persisted heartbeat |
| `src/command-policy.ts` | explicit supported-command allowlist and cloud/local separation |
| `src/lib/sandbox.test.ts` | regression for symlink escape and shell disabled by default |
| `src/config.runtime.test.ts` | fail-closed configuration tests |
| `src/heartbeat-readiness.test.ts` | freshness boundary tests |
| `src/production-hardening.test.ts` | scoped state transitions and bounded output checks |

### REBUILD for HKR Agent

- Supabase polling of `commands`.
- `SUPABASE_SERVICE_ROLE_KEY` on customer machines.
- hard-coded `PROJECT_ID=hocker-one` / HOCKER node IDs.
- Jurix endpoints.
- HOCKER mirror mode naming.
- generic `shell.exec` as a normal exposed tool.
- service scripts that assume HOCKER server directories.

HKR Agent instead requires per-device enrollment, short-lived/revocable device credentials, outbound-only control-plane connectivity, workspace-scoped capabilities, and higher-level commands such as `workspace.status`, `fs.read`, `git.status`, `checks.test`, `checks.lint`, `checks.typecheck`, `checks.build`, and a separately gated patch/write path.

## Extraction map — nova.agi

NOVA is not part of HKR Core.

Potential later adapter concepts:
- provider-neutral model routing;
- budget-aware fallback;
- MCP tool-call normalization.

Do not copy NOVA memory, AGI registry, prompts, HOCKER Supabase tables or action queue. HKR's portability goal requires a provider-neutral control plane first.

## Canonical HKR contracts

### HKR Work

A Work Session belongs to HKR, not to an AI vendor.

Minimum fields:
- `work_id`
- `workspace_id`
- `state`
- `objective`
- optional `source_runtime`
- optional `thread_ref`
- `candidate_id`
- `execution_id`
- `proof_id`
- monotonically ordered events
- idempotency key
- timestamps

State machine starts from the proven Hocker model:
`planning -> researching -> ready -> awaiting_approval -> approved -> executing -> verifying -> completed`, with explicit blocked/failed/canceled recovery transitions.

### HKR Control

Every tool has server-owned policy:
- tenant/workspace scope;
- capability key;
- read/write classification;
- risk level;
- target constraints;
- whether approval is required;
- current approval binding;
- max attempts;
- idempotency/lock state.

MCP annotations such as `readOnlyHint` and `destructiveHint` are emitted accurately, but never substitute HKR authorization.

### HKR Proof

A proof record contains normalized references, not raw secret material:
- exact candidate hash;
- repository/ref/SHA where applicable;
- tool + normalized input hash;
- approval ID when required;
- execution timestamps;
- result summary/hash;
- verification checks;
- rollback/compensation metadata;
- actor/device/runtime references;
- redaction metadata.

### HKR Agent

The Agent is an execution boundary, not a master credential holder.

Rules:
- outbound-only by default;
- no shared cloud service-role key;
- local workspace allowlist;
- no arbitrary shell in normal mode;
- bounded output and timeout;
- signed/replay-protected command envelope;
- kill switch/revocation;
- fresh-heartbeat readiness;
- audit result for every claimed command.

## First product milestone: Alpha 0

Build a standalone remote MCP server with no dependency on Hocker One runtime.

Initial tools:
1. `hkr_get_profile` — authenticated read-only identity/workspace summary.
2. `hkr_list_work` — read-only Work records.
3. `hkr_get_work` — read-only Work + proof summary.
4. `hkr_create_work` — creates only an HKR Work planning record; no provider mutation.
5. `hkr_prepare_candidate` — hashes a proposed execution candidate but does not execute it.

GitHub or local workspace writes are deliberately outside Alpha 0 until the new control/persistence boundary is proven.

## Acceptance gates before any existing HOCKER integration

- New repository CI green.
- Official MCP Inspector initialization and tool calls green.
- invalid schema/auth/workspace tests fail closed.
- no HOCKER secrets or service-role dependencies.
- no tool can write GitHub, Vercel, Supabase or local filesystem in Alpha 0.
- candidate hashes deterministic across process restarts.
- approvals cannot be reused across candidate hash/workspace/expiry.
- Hocker One, nova.agi and hocker-node-agent remain byte-for-byte unchanged by HKR implementation work.
- only after these gates: integrate `hocker.agi` as the first real HOCKER consumer/test target.

## Known Hocker documentation drift

The dated `docs/operations/LAST_KNOWN_STATE.md` text says Work Session persistence was not implemented by the initial Operating Loop slice, while current code now contains `src/lib/hocker-operating-loop/store.ts`, a persistence migration and tests. Treat current code/tests/migrations as technical truth and update continuity documentation only in a separately reviewed documentation change if needed.

## Explicit non-goals for Alpha 0

- production billing;
- public plugin submission;
- arbitrary local shell;
- auto-merge;
- production deployment of Hocker One;
- autonomous NOVA development certification;
- PUNTO.G or CHIDO writes;
- payments, gambling, KYC, surveillance/location;
- replacing Hocker One, Context Bridge or Node Agent.

## Decision

Proceed with a clean private `HockerAGI/hkr.connect` repository when repository creation is available. Do not implement HKR inside Hocker One. This document is the extraction boundary and regression guard for that work.
