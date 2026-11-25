# HKR Connect Alpha 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a separate private HKR Connect codebase that exposes a standards-compliant, fail-closed MCP server with portable HKR Work / Control / Proof contracts while leaving Hocker One, NOVA and hocker-node-agent unchanged.

**Architecture:** Clean-room TypeScript monorepo. Reuse proven HOCKER algorithms and invariants at contract level, but rebuild storage/auth/provider adapters so no HOCKER service-role, AGI canon, Owner identity or fixed repository list becomes customer authorization. Alpha 0 exposes only non-provider-mutating Work/Proof tools over official MCP Streamable HTTP.

**Tech Stack:** Node.js 22.x, TypeScript, npm workspaces, MCP TypeScript SDK v2 (`@modelcontextprotocol/server` plus `@modelcontextprotocol/node` for Node HTTP adaptation), Zod only at the external MCP schema boundary, Node built-in test runner, PostgreSQL-compatible persistence interface.

**Spec:** `docs/superpowers/specs/2026-11-24-hkr-connect-extraction-design.md`

## Global Constraints

- Existing HOCKER repositories remain unchanged by implementation.
- New code belongs in private `HockerAGI/hkr.connect`.
- Node.js 22.x is the runtime floor for Alpha 0.
- Use the official MCP TypeScript SDK v2 server surface (`@modelcontextprotocol/server`); use `@modelcontextprotocol/node` only for the Node HTTP adapter.
- MCP public transport is Streamable HTTP at `/mcp`.
- Authorization is enforced in server code for every request; MCP annotations never grant access.
- Alpha 0 performs no GitHub, Vercel, Supabase, filesystem, shell, payment, gambling, KYC, surveillance or location mutation.
- No arbitrary shell tool.
- No shared Hocker One service-role credentials.
- No raw chats or secrets in proof records.
- Candidate hashing is deterministic canonical JSON + SHA-256.
- Writes to existing HOCKER repos are forbidden for Alpha 0.
- CI must use read-only repository permissions.

## Review Focus

1. Cross-workspace identifier substitution must return authorization failure without revealing existence.
2. Candidate payload key ordering must not change the candidate hash.
3. Replayed create-work requests with the same idempotency key must not create duplicate work.
4. Malformed/oversized MCP inputs must fail before storage mutation.
5. Proof/result serialization must reject secret-like fields and raw credential material.

---

### Task 1: Repository bootstrap and immutable safety baseline

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `SECURITY.md`
- Create: `AGENTS.md`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: approved extraction spec.
- Produces: Node 22 npm-workspaces repository with read-only CI.

- [ ] **Step 1: Create private repository `HockerAGI/hkr.connect` with `main` and no production deployment.**

Expected: repository exists privately; no Hocker One files are copied wholesale.

- [ ] **Step 2: Write the baseline package/toolchain files.**

Root `package.json` must set `private:true`, `engines.node:"22.x"`, npm workspaces for `apps/*` and `packages/*`, and scripts for `test`, `typecheck`, `build`, and `audit`.

- [ ] **Step 3: Add fail-closed repository instructions.**

`AGENTS.md` must explicitly prohibit direct `main` writes, copying HOCKER secrets, enabling provider mutations in Alpha 0, or treating a configured adapter as live evidence.

- [ ] **Step 4: Add CI.**

CI must use `permissions: contents: read`, reproducible install, tests, typecheck, build and `npm audit --audit-level=high`.

- [ ] **Step 5: Run baseline verification.**

Run: `npm ci && npm test && npm run typecheck && npm run build && npm audit --audit-level=high`  
Expected: PASS.

- [ ] **Step 6: Commit.**

Commit: `chore: bootstrap HKR Connect alpha`

---

### Task 2: Portable HKR Work protocol

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/src/work.ts`
- Create: `packages/protocol/src/state.ts`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/test/work.test.ts`

**Interfaces:**
- Produces:
  - `WorkState`
  - `WorkRecord`
  - `WorkEvent`
  - `parseWorkRecord(value): WorkRecord`
  - `assertWorkTransition(from, to): void`

- [ ] **Step 1: Write failing state-machine tests.**

Assertions cover planning/researching/ready/awaiting_approval/approved/executing/verifying/completed plus blocked/failed/canceled recovery and terminal-state rejection.

- [ ] **Step 2: Run the focused tests and verify RED.**

Run: `node --test packages/protocol/test/work.test.ts`  
Expected: FAIL because protocol exports do not exist.

- [ ] **Step 3: Implement the minimal dependency-free TypeScript contracts, runtime parser and transition function.**

Use neutral names only; no AGI/NOVA/Hocker project fields. Do not import Zod into HKR Core.

- [ ] **Step 4: Add workspace/idempotency validation tests.**

`workspace_id`, `work_id`, objective, monotonic event sequence and idempotency key are required/bounded.

- [ ] **Step 5: Run focused + full tests.**

Expected: PASS.

- [ ] **Step 6: Commit.**

Commit: `feat(protocol): add portable HKR Work contracts`

---

### Task 3: HKR Proof canonical hashing and secret rejection

**Files:**
- Create: `packages/proof/package.json`
- Create: `packages/proof/src/canonical.ts`
- Create: `packages/proof/src/secret-policy.ts`
- Create: `packages/proof/src/proof.ts`
- Create: `packages/proof/src/index.ts`
- Create: `packages/proof/test/proof.test.ts`

**Interfaces:**
- Consumes: Work identifiers from Task 2.
- Produces:
  - `canonicalJson(value): string`
  - `sha256Hex(value): Promise<string>`
  - `containsSecretMaterial(value): boolean`
  - `Candidate`
  - `ProofRecord`
  - `parseCandidate(value): Candidate`
  - `parseProofRecord(value): ProofRecord`
  - `candidateHash(candidateWithoutHash): Promise<string>`

- [ ] **Step 1: Write failing deterministic-hash tests.**

Same semantic object with different key order must generate the same hash; different execution scope/SHA must generate a different hash.

- [ ] **Step 2: Write failing secret-material tests.**

Reject keys/values representing authorization, cookies, tokens, API/private keys and raw transcript/message blobs.

- [ ] **Step 3: Run tests and verify RED.**

- [ ] **Step 4: Implement canonicalization, hashing and proof schemas.**

Reuse algorithmic behavior from Hocker One, not HOCKER names/storage.

- [ ] **Step 5: Run tests and verify GREEN.**

- [ ] **Step 6: Commit.**

Commit: `feat(proof): add deterministic candidate evidence`

---

### Task 4: HKR Control policy and approval envelopes

**Files:**
- Create: `packages/control/package.json`
- Create: `packages/control/src/capability.ts`
- Create: `packages/control/src/approval.ts`
- Create: `packages/control/src/idempotency.ts`
- Create: `packages/control/src/index.ts`
- Create: `packages/control/test/control.test.ts`

**Interfaces:**
- Consumes: candidate hashes from Task 3.
- Produces:
  - `CapabilityPolicy`
  - `ApprovalEnvelope`
  - `parseCapabilityPolicy(value): CapabilityPolicy`
  - `parseApprovalEnvelope(value): ApprovalEnvelope`
  - `authorizeCapability(context, policy): AuthorizationDecision`
  - `assertApprovalMatchesCandidate(approval, candidate): void`

- [ ] **Step 1: Write failing tenant/workspace authorization tests.**

A valid user in workspace A cannot read/create Work in workspace B even with a syntactically valid work ID.

- [ ] **Step 2: Write failing approval-binding tests.**

Approval must bind workspace, candidate hash, scope, actor and expiry; altered candidate hash or expired approval fails.

- [ ] **Step 3: Write idempotency collision tests.**

Same workspace + same idempotency key returns the same logical operation; same key in another workspace is independent.

- [ ] **Step 4: Implement minimal dependency-free policy, parser and approval contracts.**

Do not implement provider writes. Keep Zod out of HKR Core; the MCP adapter owns external JSON schema parsing.

- [ ] **Step 5: Run tests and verify GREEN.**

- [ ] **Step 6: Commit.**

Commit: `feat(control): add workspace-scoped authorization contracts`

---

### Task 5: Storage boundary without HOCKER service-role coupling

**Files:**
- Create: `packages/storage/package.json`
- Create: `packages/storage/src/types.ts`
- Create: `packages/storage/src/memory-store.ts`
- Create: `packages/storage/src/index.ts`
- Create: `packages/storage/test/store.test.ts`
- Create: `docs/architecture/storage.md`

**Interfaces:**
- Consumes: Work/Proof/Control schemas.
- Produces:
  - `WorkStore` interface
  - `MemoryWorkStore` deterministic test/dev adapter

- [ ] **Step 1: Write failing store contract tests for create/get/list/events/idempotency.**

- [ ] **Step 2: Add cross-workspace non-disclosure tests.**

Foreign workspace reads return the same not-found/forbidden contract chosen by HKR policy and never return foreign payload.

- [ ] **Step 3: Implement the in-memory adapter only for Alpha 0 tests/dev.**

The interface must be compatible with a later PostgreSQL adapter. Documentation must state memory storage is not production durability.

- [ ] **Step 4: Run tests and verify GREEN.**

- [ ] **Step 5: Commit.**

Commit: `feat(storage): define HKR persistence boundary`

---

### Dependency checkpoint — re-query before locking

Evidence cut 2026-11-24/25 UTC boundary: official MCP TypeScript SDK latest observed is `@modelcontextprotocol/server@2.4.0`; its release pairs `@modelcontextprotocol/node@2.1.2`. Stable TypeScript observed is `7.0.2`. These are research checkpoints, not perpetual pins: re-query official package/release sources immediately before generating the production lockfile, then lock exact reviewed versions.

### Task 6: Standards-compliant MCP server

**Files:**
- Create: `apps/mcp-server/package.json`
- Create: `apps/mcp-server/src/auth.ts`
- Create: `apps/mcp-server/src/server.ts`
- Create: `apps/mcp-server/src/http.ts`
- Create: `apps/mcp-server/src/tools/profile.ts`
- Create: `apps/mcp-server/src/tools/work.ts`
- Create: `apps/mcp-server/src/tools/candidate.ts`
- Create: `apps/mcp-server/test/server.test.ts`

**Interfaces:**
- Consumes: `WorkStore`, protocol/control/proof packages.
- Produces: Streamable HTTP MCP endpoint at `/mcp`.

- [ ] **Step 1: Add the current stable MCP TypeScript SDK v2 server package, Node HTTP adapter and Zod dependencies, then write the failing initialization test.**

Server identity: `hkr-connect`, semantic version from package. Use the modern v2 server APIs (`McpServer` / `createMcpHandler`) and a Node adapter (`toNodeHandler`) rather than the legacy v1 umbrella package.

- [ ] **Step 2: Implement request auth context.**

Alpha dev/test uses an injected auth resolver interface; production OAuth is not faked. Missing/invalid auth fails closed.

- [ ] **Step 3: Register `hkr_get_profile`.**

Read-only, closed-world annotation, returns authenticated workspace/profile only.

- [ ] **Step 4: Register `hkr_list_work` and `hkr_get_work`.**

Both read-only; server enforces workspace scope.

- [ ] **Step 5: Register `hkr_create_work`.**

Creates an HKR planning record only. It does not mutate any external provider. Annotate accurately as state-changing but non-destructive.

- [ ] **Step 6: Register `hkr_prepare_candidate`.**

Creates/returns deterministic candidate hash and proof metadata; no execution.

- [ ] **Step 7: Add malformed, oversized, unauthorized and cross-workspace tests.**

- [ ] **Step 8: Run full suite.**

Expected: PASS.

- [ ] **Step 9: Commit.**

Commit: `feat(mcp): expose HKR Work and Proof alpha tools`

---

### Task 7: MCP Inspector and direct client conformance

**Files:**
- Create: `docs/operations/alpha0-mcp-validation.md`
- Create: `tests/fixtures/mcp/README.md`

**Interfaces:**
- Consumes: running `apps/mcp-server`.
- Produces: reproducible conformance evidence; no production claim.

- [ ] **Step 1: Start server on loopback only.**

- [ ] **Step 2: Run official MCP Inspector.**

Run: `npx @modelcontextprotocol/inspector`  
Verify initialization, advertised tool list, schemas and annotations.

- [ ] **Step 3: Call every tool with valid and invalid input.**

Verify auth and workspace restrictions.

- [ ] **Step 4: Record exact package versions and result summary.**

Do not store credentials or raw tokens.

- [ ] **Step 5: Run full repository verification again.**

- [ ] **Step 6: Commit.**

Commit: `test(mcp): record Alpha 0 conformance evidence`

---

### Task 8: Pre-integration security review

**Files:**
- Create: `docs/security/alpha0-review.md`
- Modify only if findings require it: new HKR repository files from Tasks 2-7.

**Interfaces:**
- Produces: explicit GO/NO-GO for any HOCKER consumer integration.

- [ ] **Step 1: Search repository for HOCKER production secret names and service-role coupling.**

Expected: no production HOCKER credentials or values.

- [ ] **Step 2: Verify there are zero external provider mutation tools.**

Expected: no GitHub/Vercel/Supabase/local filesystem write executor reachable through MCP.

- [ ] **Step 3: Run dependency audit and tests.**

- [ ] **Step 4: Verify existing HOCKER repositories were not modified by implementation.**

Compare their main SHAs against the implementation-start snapshot; normal unrelated upstream activity must be distinguished from HKR changes.

- [ ] **Step 5: Record GO/NO-GO.**

Only GO permits planning the first `hocker.agi` integration.

- [ ] **Step 6: Commit.**

Commit: `docs: certify HKR Connect Alpha 0 boundary`

## Deferred independent plans

The following are intentionally separate after Alpha 0:

1. **HKR Agent** — per-device enrollment, outbound control channel, local workspace commands, sandbox and patch gate.
2. **GitHub provider writes** — tenant GitHub App installation, exact-SHA branch/file/PR lifecycle, approval and proof.
3. **Durable PostgreSQL persistence** — production storage adapter, migrations, backup/restore and tenant isolation.
4. **OAuth 2.1 / public plugin submission** — discovery, multi-account profile, production HTTPS and review requirements.
5. **Cross-runtime resume** — ChatGPT/Codex/other runtime pointers attached to HKR Work without raw chat storage.
6. **Hocker One adapter** — optional consumer of HKR after Alpha contracts are stable.

## Self-review

- Spec coverage: Alpha 0 covers independent repo, Work, Control, Proof, official MCP server, auth boundary and no-provider-write guarantee.
- Type consistency: Work IDs/workspace IDs/candidate hashes flow protocol -> proof/control -> storage -> MCP.
- Review focus: cross-workspace access, hash determinism, idempotency, malformed input and secret rejection each have explicit tests.
- Proportion: local Agent, provider writes, production OAuth and DB are split into later plans instead of expanding Alpha 0.
