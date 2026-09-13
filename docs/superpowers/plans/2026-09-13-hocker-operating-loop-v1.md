# Hocker Operating Loop v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Hocker One into the primary HOCKER operator workspace by adding a durable orchestration loop around existing chat, AGI, task, action, evidence and Owner Gate infrastructure, with current-research gating and one scoped human approval for material execution.

**Architecture:** Add a thin orchestration layer that references existing persistence rather than introducing a second memory, queue, registry or runtime. A Work Session binds research, capability routing, tasks/runs/actions, candidate state, approval and evidence; material execution is released by a scoped Owner AAL2 approval and resumes from persisted state after interruption.

**Tech Stack:** Next.js App Router, TypeScript, Zod, existing Hocker AGI runtime, Supabase/Postgres, GitHub Actions, Vercel, existing MCP registry, existing `agi_action_queue`, existing Owner Gate/AAL2, existing evidence/audit infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-10-hocker-operating-loop-v1-design.md`

## Global Constraints

- Use current `main` and current production/migration/runtime state as authority; historical handoffs never override live evidence.
- Before every material execution, verify current official documentation, relevant external repositories/release notes/security advisories, and current HOCKER state; store source/version/date/impact in the evidence package.
- Do not introduce a second memory store, action queue, MCP registry, approval system, runtime router, or external workflow engine.
- `allow_actions=false` remains the default for AGI identities; no global action enablement.
- `main` is never directly written by the agent workflow; all code changes use an isolated branch and PR.
- No production promotion while any mandatory automated gate is red or unknown.
- Every promoted change must reconcile `main`, production deployment, migration head, runtime revision, health/smoke and documentation/continuity records.
- Sensitive/mutating operations remain behind Owner Gate/AAL2 and must be idempotent or compensatable.
- Supabase RLS and grants are evaluated together; advisor findings are not remediated by blind revocation or index deletion.
- MCP changes must be checked against the current `2026-07-28` specification before implementation; migration is conditional on a verified compatibility gap.

---

### Task 1: Define the orchestration contracts without changing execution behavior

**Files:**
- Create: `src/lib/hocker-operating-loop/types.ts`
- Create: `src/lib/hocker-operating-loop/state.ts`
- Create: `src/lib/hocker-operating-loop/hash.ts`
- Test: `tests/hocker-operating-loop-contracts.test.mjs`

**Interfaces:**
- Consumes: existing session/task/action/evidence identifiers as opaque IDs.
- Produces: `WorkSessionState`, `WorkSessionEnvelope`, `ExecutionCandidate`, `ApprovalEnvelope`, `ResearchRecord` contracts and deterministic hashing helpers.

- [ ] **Step 1: Write the failing tests**

Create contract tests that assert:
- only the declared state enum values are accepted;
- candidate hashes are deterministic for identical canonical payloads;
- approval envelopes carry candidate hash, scope and expiry;
- approval invalidates when candidate hash, scope or expiry changes;
- research records require source URL, consulted timestamp and impact;
- no contract contains a second queue/memory/registry identifier.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:
```bash
node --test tests/hocker-operating-loop-contracts.test.mjs
```
Expected: FAIL because the orchestration contracts do not yet exist.

- [ ] **Step 3: Implement the minimal contracts**

`WorkSessionState`:
```ts
export type WorkSessionState =
  | "planning"
  | "researching"
  | "ready"
  | "awaiting_owner"
  | "approved"
  | "executing"
  | "verifying"
  | "completed"
  | "blocked"
  | "failed"
  | "canceled";
```

Define `ResearchRecord`, `ExecutionCandidate`, `ApprovalEnvelope` and `WorkSessionEnvelope` with Zod schemas and readonly TypeScript types. Candidate hash must be calculated from a stable, sorted JSON representation of the bound fields.

- [ ] **Step 4: Run the focused tests**

Run:
```bash
node --test tests/hocker-operating-loop-contracts.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hocker-operating-loop tests/hocker-operating-loop-contracts.test.mjs
git commit -m "feat(operating-loop): add orchestration contracts"
```

---

### Task 2: Persist Work Session state by referencing existing records

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_hocker_operating_loop_v1.sql`
- Create: `src/lib/hocker-operating-loop/store.ts`
- Test: `tests/hocker-operating-loop-store.test.mjs`
- Test: `supabase/tests/hocker_operating_loop_security.sql`

**Interfaces:**
- Consumes: Task 1 contracts; existing `agi_sessions`, `agi_tasks`, `agi_runs`, action/evidence identifiers.
- Produces: `createWorkSession`, `getWorkSession`, `transitionWorkSession`, `attachCandidate`, `attachResearch`, `attachApproval`, `recordCheckpoint`.

- [ ] **Step 1: Write failing store/SQL contract tests**

Test that:
- a work session can reference an existing thread/session;
- state transitions are legal and idempotent;
- tenant/project isolation is enforced;
- approval/research/candidate records are scoped to the work session;
- duplicate transitions do not create duplicate state records;
- no row allows bypassing existing action/evidence ownership controls.

- [ ] **Step 2: Run tests to confirm failure**

Run:
```bash
node --test tests/hocker-operating-loop-store.test.mjs
```
Expected: FAIL because the store does not exist.

- [ ] **Step 3: Design the minimum SQL schema**

Create a small orchestration table set:
- `hocker_work_sessions`
- `hocker_work_session_events`
- `hocker_research_records`
- `hocker_execution_candidates`
- `hocker_approval_envelopes`

Do not copy prompt history, messages, action queue rows or evidence payloads into these tables. Store references/foreign keys and immutable hashes/metadata only.

Add RLS, role-scoped policies, unique constraints for `(work_session_id, state_sequence)` and candidate/approval hashes, plus indexes justified by actual access paths.

- [ ] **Step 4: Implement the store**

Implement idempotent create/transition/checkpoint operations using the existing Supabase server/admin access patterns. Every mutation must include project/tenant scope and an idempotency key where a retry can repeat a request.

- [ ] **Step 5: Run SQL and focused tests**

Run:
```bash
node --test tests/hocker-operating-loop-store.test.mjs
```
Expected: PASS.

Run the project’s Supabase security contract suite for the new tables and verify RLS/grant behavior.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations src/lib/hocker-operating-loop/store.ts tests/hocker-operating-loop-store.test.mjs supabase/tests/hocker_operating_loop_security.sql
git commit -m "feat(operating-loop): persist durable work sessions"
```

---

### Task 3: Turn the Research Gate into an executable preflight

**Files:**
- Create: `src/lib/hocker-operating-loop/research-gate.ts`
- Create: `src/app/api/orchestrator/research-gate/route.ts`
- Create: `tests/hocker-operating-loop-research-gate.test.mjs`
- Modify: `src/lib/agi-research-gate.ts`

**Interfaces:**
- Consumes: material execution intent, Work Session ID, current capability/tool decisions.
- Produces: `runResearchGate(workSession, intent)` returning `pass | block | stale` plus persisted `ResearchRecord[]`.

- [ ] **Step 1: Write failing tests**

Cover:
- primary sources preferred;
- missing consulted timestamp blocks;
- stale source revision blocks when a version-sensitive dependency changed;
- current HOCKER code/config drift blocks execution;
- research findings are attached to the candidate before approval;
- read-only low-risk queries may use the existing local research path when policy marks them safe.

- [ ] **Step 2: Verify failure**

Run:
```bash
node --test tests/hocker-operating-loop-research-gate.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement the gate**

Reuse existing `agi-research-gate` logic and add the orchestration wrapper. Keep the source record schema aligned with the project’s documentary requirements: source, title, URL, publisher/project, version/revision, dates, scope, relevance, impact and risk.

- [ ] **Step 4: Add endpoint contract**

Expose a server-side preflight endpoint that only evaluates and stores research. It must not write production code, execute external mutations or grant action permissions.

- [ ] **Step 5: Verify**

Run the focused tests plus existing `agi-research-gate` regression tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hocker-operating-loop/research-gate.ts src/app/api/orchestrator/research-gate/route.ts src/lib/agi-research-gate.ts tests/hocker-operating-loop-research-gate.test.mjs
git commit -m "feat(operating-loop): enforce current research preflight"
```

---

### Task 4: Build Candidate readiness from existing capability/routing/execution data

**Files:**
- Create: `src/lib/hocker-operating-loop/candidate-builder.ts`
- Create: `tests/hocker-operating-loop-candidate.test.mjs`
- Modify: `src/lib/hocker-tool-router.ts`
- Modify: `src/lib/agi-runtime-core.ts` only where a reusable contract is missing; otherwise do not edit.

**Interfaces:**
- Consumes: capability decision, AGI owner/support, tool states, research records, code/runtime state, test/security results.
- Produces: deterministic `ExecutionCandidate` and readiness classification.

- [ ] **Step 1: Write failing tests**

Assert that the candidate contains:
- objective;
- capability/AGI owner;
- tool/provider set;
- current research;
- exact repo/SHA when code is involved;
- current migration head when data is involved;
- runtime revision when runtime is involved;
- automated check summary;
- security disposition;
- rollback plan;
- cost/limits;
- execution scope.

Assert that unknown mandatory fields yield `not_ready`, never an optimistic ready state.

- [ ] **Step 2: Confirm failure**

Run:
```bash
node --test tests/hocker-operating-loop-candidate.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement the builder**

Reuse `buildNovaChatCapabilitiesContext` and current executor status APIs. Do not add a second routing table. The candidate is a snapshot wrapper over existing state.

- [ ] **Step 4: Verify**

Run focused tests and existing capability/router tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hocker-operating-loop/candidate-builder.ts tests/hocker-operating-loop-candidate.test.mjs
# include router/runtime edits only if strictly required by the tests
git commit -m "feat(operating-loop): build deterministic execution candidates"
```

---

### Task 5: Add the scoped one-time Owner Approval Envelope

**Files:**
- Create: `src/lib/hocker-operating-loop/approval-envelope.ts`
- Create: `src/app/api/orchestrator/approval/route.ts`
- Create: `tests/hocker-operating-loop-approval.test.mjs`
- Modify: `src/lib/owner-session-gate.ts` only where needed to return approval identity/version metadata.

**Interfaces:**
- Consumes: `ExecutionCandidate`, current Owner AAL2 state, existing Owner Gate.
- Produces: `createApprovalEnvelope`, `validateApprovalEnvelope`, `revokeApprovalEnvelope`.

- [ ] **Step 1: Write failing approval tests**

Cover:
- AAL1 cannot create an approval envelope;
- AAL2 can approve only the exact candidate hash/scope;
- expired approval fails closed;
- candidate hash change invalidates approval;
- approval cannot be reused for a second unrelated work session;
- no approval changes `allow_actions` globally.

- [ ] **Step 2: Run focused tests**

Run:
```bash
node --test tests/hocker-operating-loop-approval.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement envelope validation**

Bind approval to:
`work_session_id + candidate_hash + project_id + scope + owner_user_id + aal2_evidence_id + issued_at + expires_at`.

Require the existing `requireOwnerAal2Api` gate. Keep the Owner Gate as the ultimate authorization boundary.

- [ ] **Step 4: Verify**

Run approval tests plus all existing Owner Gate/AAL2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hocker-operating-loop/approval-envelope.ts src/app/api/orchestrator/approval/route.ts src/lib/owner-session-gate.ts tests/hocker-operating-loop-approval.test.mjs
git commit -m "feat(operating-loop): add scoped owner approval envelopes"
```

---

### Task 6: Make orchestration resumable and idempotent

**Files:**
- Create: `src/lib/hocker-operating-loop/runner.ts`
- Create: `src/lib/hocker-operating-loop/transitions.ts`
- Create: `tests/hocker-operating-loop-runner.test.mjs`
- Modify: `src/app/api/orchestrator/run/route.ts`

**Interfaces:**
- Consumes: Work Session, Research Gate result, Candidate, Approval Envelope, existing task/action execution APIs.
- Produces: checkpointed progression through `executing -> verifying -> completed|failed`.

- [ ] **Step 1: Write failing interruption/idempotency tests**

Cover:
- work resumes from the last persisted state;
- completed non-idempotent steps are not replayed;
- transient failures retry only when policy allows;
- approval invalidation returns to `ready/awaiting_owner`, not execution;
- long-running work is represented by persisted state rather than requiring an HTTP request to stay open.

- [ ] **Step 2: Verify failure**

Run:
```bash
node --test tests/hocker-operating-loop-runner.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement transition engine**

Use a small deterministic state machine. Each transition writes a checkpoint event. External side effects execute only after a durable `approved` checkpoint and after a final exact-state validation.

- [ ] **Step 4: Integrate existing task/action infrastructure**

Do not replace `agi_action_queue`. Create adapters that submit or execute existing action records and attach their IDs to the Work Session.

- [ ] **Step 5: Verify**

Run the focused suite plus existing queue resilience, provider failover and certification runner tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hocker-operating-loop/runner.ts src/lib/hocker-operating-loop/transitions.ts src/app/api/orchestrator/run/route.ts tests/hocker-operating-loop-runner.test.mjs
git commit -m "feat(operating-loop): make execution resumable"
```

---

### Task 7: Expose one operator workflow in NOVA without broad redesign

**Files:**
- Create: `src/components/NovaWorkSessionPanel.tsx`
- Create: `tests/nova-work-session-ui-contract.test.mjs`
- Modify: `src/components/NovaRealtimeChat.tsx`
- Modify: `src/components/NovaRealtimeChatLazy.tsx`
- Modify: `src/components/WorkspaceBar.tsx` only if necessary to expose the current work session.

**Interfaces:**
- Consumes: Work Session API, Candidate, approval state and evidence links.
- Produces: one conversational work surface showing progress, blockers, candidate summary and the final approval action when applicable.

- [ ] **Step 1: Write failing UI contract tests**

Assert that the primary surface can display:
- current work session state;
- research/preflight progress;
- AGI selected automatically;
- tools/providers selected automatically;
- candidate readiness;
- a single final approval action;
- evidence and technical detail on demand.

- [ ] **Step 2: Verify failure**

Run the existing UI contract suite plus the new test. Expected new test FAIL.

- [ ] **Step 3: Implement the smallest integration**

Do not remove existing tools/repository panels. Make them secondary details reachable from the main NOVA work session rather than separate mandatory workflows.

- [ ] **Step 4: Verify**

Run:
```bash
npm test -- --test-name-pattern="work session|nova"
```
plus the existing clean-UX/unified-navigation tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/NovaWorkSessionPanel.tsx src/components/NovaRealtimeChat.tsx src/components/NovaRealtimeChatLazy.tsx tests/nova-work-session-ui-contract.test.mjs
# include WorkspaceBar only if strictly required
git commit -m "feat(operating-loop): surface work sessions in NOVA"
```

---

### Task 8: Connect the coding workflow to exact-head validation

**Files:**
- Create: `tests/hocker-operating-loop-github-flow.test.mjs`
- Modify: `src/lib/github-runtime-executor.ts` only for gaps identified by tests.
- Modify: `src/app/api/agi/runtime/github/route.ts` only for gaps identified by tests.
- Modify: `.github/workflows/ci.yml` only after validating current workflow behavior.

**Interfaces:**
- Consumes: Work Session candidate and existing GitHub executor.
- Produces: exact-head branch→edit→diff→test→CI→Preview→approval→merge evidence flow.

- [ ] **Step 1: Write failing tests**

Cover:
- branch is created from exact audited `main` SHA;
- stale `expected_sha` is rejected;
- writes cannot target `main`;
- PR candidate records base/head SHA;
- CI result is associated with the exact head;
- production promotion requires candidate SHA equality.

- [ ] **Step 2: Run and confirm failure**

Run:
```bash
node --test tests/hocker-operating-loop-github-flow.test.mjs
```

- [ ] **Step 3: Implement only missing guards**

Reuse `createGitHubWriteGatePlan`, `expected_sha`, repository/path allowlists and Owner Gate. Do not add a parallel GitHub executor.

- [ ] **Step 4: Verify**

Run GitHub supply-chain, backend-only, owner-gate and repository governance suites.

- [ ] **Step 5: Commit**

```bash
git add tests/hocker-operating-loop-github-flow.test.mjs src/lib/github-runtime-executor.ts src/app/api/agi/runtime/github/route.ts .github/workflows/ci.yml
git commit -m "feat(operating-loop): bind coding flow to exact-head evidence"
```

---

### Task 9: Add post-release documentation reconciliation automation

**Files:**
- Create: `src/lib/hocker-operating-loop/documentation-reconciler.ts`
- Create: `tests/hocker-operating-loop-doc-reconcile.test.mjs`
- Modify: `docs/AGI_RESEARCH_GATE.md`
- Modify: `DEPLOYMENT.md`
- Modify: `AGENTS.md`
- Modify: `README.md` only if user/operator flow has materially changed.

**Interfaces:**
- Consumes: successful release evidence, current main SHA, deployment SHA, migration head, runtime revision and external research record.
- Produces: reconciliation report plus updated operational continuity records.

- [ ] **Step 1: Write failing tests**

Assert that a successful release cannot be marked documentation-current until:
- production SHA matches candidate;
- migration head is recorded;
- runtime revision is recorded if applicable;
- research metadata is preserved;
- affected docs are identified;
- stale handoff assertions are rejected.

- [ ] **Step 2: Confirm failure**

Run:
```bash
node --test tests/hocker-operating-loop-doc-reconcile.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement reconciler**

Create a deterministic reconciliation report and update only documents explicitly affected by the candidate. Do not rewrite canonical PDFs automatically.

- [ ] **Step 4: Verify**

Run project continuity/documentation tests and compare the resulting claims to live GitHub/Vercel/Supabase evidence.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hocker-operating-loop/documentation-reconciler.ts tests/hocker-operating-loop-doc-reconcile.test.mjs docs/AGI_RESEARCH_GATE.md DEPLOYMENT.md AGENTS.md README.md
git commit -m "docs(operating-loop): reconcile operational docs after release"
```

---

### Task 10: Certification and release candidate gate

**Files:**
- Create: `tests/hocker-operating-loop-release-gate.test.mjs`
- Create: `docs/superpowers/evidence/operating-loop-v1-release-checklist.md`
- Modify: `.github/workflows/ci.yml` only if a missing gate is proven.

**Interfaces:**
- Consumes: all prior contracts and verification outputs.
- Produces: a release-readiness decision that is `READY`, `BLOCKED`, or `STALE`.

- [ ] **Step 1: Write failing release-gate tests**

Assert `READY` only when all mandatory signals are green:
- research current;
- candidate hash stable;
- tests/typecheck/lint/build/audit green;
- security findings dispositioned;
- approval valid when required;
- migration state compatible;
- exact production/preview linkage verified;
- rollback plan exists;
- evidence pack complete.

- [ ] **Step 2: Verify failure**

Run focused tests. Expected: FAIL until all required inputs are wired.

- [ ] **Step 3: Implement release gate**

Keep `main` and production protected. The gate must not itself merge or deploy; it only authorizes the existing release path when its contract is satisfied.

- [ ] **Step 4: Verify full repository suite**

Run:
```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

Then run the targeted security/evidence suites and exact-head preview validation.

- [ ] **Step 5: Commit**

```bash
git add tests/hocker-operating-loop-release-gate.test.mjs docs/superpowers/evidence/operating-loop-v1-release-checklist.md .github/workflows/ci.yml

git commit -m "feat(operating-loop): enforce release candidate readiness"
```

---

## Cross-task verification rules

1. Before each implementation task, re-read the current `main` SHA, current PR/branch state, current migration head, current production deployment and relevant runtime/configuration state.
2. Before each task that depends on an external platform, re-check official current documentation and current upstream repository/release notes; record the consulted versions and dates in the task evidence.
3. After every successful task, verify the branch tip and run only the focused tests first.
4. After the complete slice is green, open/update the PR, wait for exact-head CI/Preview validation and do not merge until all mandatory gates are green.
5. After every successful merge to `main` and production promotion, run the documentation reconciliation task before starting the next material change.
6. If `main`, production, migration head or runtime revision changes while a candidate is awaiting approval, invalidate the candidate and return to preflight instead of rebasing silently.
7. No destructive branch cleanup is part of this plan. Historical branches remain untouched unless separately audited and explicitly classified as safe.
