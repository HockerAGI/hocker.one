# NOVA Workspace Capability Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing NOVA workspace into the primary Hocker One operating surface by exposing existing real capabilities incrementally—history, tools/connectors, actions/approvals, evidence, artifacts/files, and voice—without duplicating the existing capability registry, OperationalState, Owner Gate, MCP routing, or runtime contracts.

**Architecture:** Preserve the current `NovaRealtimeChat` behavior and server contracts, extracting focused UI responsibilities only where needed. All capability discovery continues through the existing canonical capability contract/registry; all material actions continue through Hocker One policy and Owner Gate; evidence remains durable and linked to the originating action/run. No provider becomes an architectural dependency.

**Tech Stack:** Next.js App Router, React/TypeScript, Supabase, existing Hocker capability contract/registry, existing NOVA runtime/API routes, GitHub/Vercel, Vitest/Node tests already used by the repository, Tailwind/CSS already present.

**Spec:** Existing canonical Hocker One operating rules, `AGENTS.md`, `docs/operations/INDEX.md`, active handoff, and the project continuation requirements supplied in the active project context.

## Global Constraints

- Never write directly to `main`; every mutation must use a branch and PR.
- Do not create a second OperationalState; reuse existing runtime snapshot sources.
- Do not create a second capability registry, MCP gateway, Owner Gate, Context Bridge, or memory store.
- `allow_actions=false` remains the baseline until a specific capability passes its own versioned safety gate.
- Read/Draft/Action semantics remain explicit; material actions require risk-appropriate approval and AAL2 when required.
- Preview must correspond to the exact PR head; production must correspond to the merged tested SHA.
- Documentation is source-first: update the smallest current Markdown source of truth and then publish secondary formats only if required.
- Do not expose provider/model internals in normal NOVA UX.

---

### Task 1: Reconcile and lock the existing NOVA capability surfaces

**Files:**
- Modify: `docs/operations/HANDOFF_2026-08-30.md` only if current evidence requires a state correction.
- Modify: `docs/operations/LAST_KNOWN_STATE.md` only if pointers become stale during this milestone.
- Test: existing capability/workspace regression tests identified by repository search.

**Interfaces:**
- Consumes: `getHockerCapabilitiesContract`, `getCapabilityRegistrySnapshot`, existing NOVA chat routes, existing OperationalState snapshot.
- Produces: a verified baseline for the workspace implementation with no duplicate abstraction.

- [ ] **Step 1: Re-read current source files and tests**

Run repository search for:
- `getHockerCapabilitiesContract`
- `getCapabilityRegistrySnapshot`
- `getHockerOperationalSnapshot`
- `NovaRealtimeChat`
- `owner_gate`
- `agi_action_queue`

Record exact current paths in the PR description.

- [ ] **Step 2: Identify any already-merged history/tools/action UI**

Do not add a component when an equivalent current-main component or route already exists. Prefer reuse or extraction over duplication.

- [ ] **Step 3: Add/adjust a structural regression test**

The test must assert that NOVA workspace uses the canonical capability contract and does not instantiate a second registry/store.

- [ ] **Step 4: Run the focused test**

Run the exact existing test command selected in Step 3 and require PASS before proceeding.

- [ ] **Step 5: Commit the reconciliation-only changes**

```bash
git add docs tests
git commit -m "chore(nova): reconcile workspace capability baseline"
```

---

### Task 2: Extract conversation and composer without changing behavior

**Files:**
- Create or modify the smallest existing component files under `src/components/` after confirming there is no equivalent implementation.
- Test: existing NOVA workspace component/contract tests plus a new focused regression test only if a behavior has no coverage.

**Interfaces:**
- Consumes: current `NovaRealtimeChat` state/types/helpers and canonical capability selection.
- Produces: stable conversation/composer boundaries with the same API requests, streaming semantics, queue-lock fail-closed behavior, and action draft rules.

- [ ] **Step 1: Write a failing structural test for the intended boundaries**

The test must verify that extraction does not remove:
- stream route `/api/nova/chat/stream`;
- action-capable route `/api/nova/chat`;
- `allow_actions=false` on streaming;
- fail-closed queue locking;
- canonical capability selection.

- [ ] **Step 2: Run the focused test and verify RED**

Run the exact test file and record the failure proving the behavior is not yet expressed by the new boundary.

- [ ] **Step 3: Extract the minimum code**

Move only presentational/state-independent logic first. Keep network orchestration in its existing owner until the tests are green. Do not introduce a new global store.

- [ ] **Step 4: Run focused tests, typecheck, and lint**

Run:
```bash
npm test -- <focused-test>
npm run typecheck
npm run lint
```

All must PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components tests
git commit -m "refactor(nova): isolate workspace conversation and composer"
```

---

### Task 3: Add real History surface using existing persistence

**Files:**
- Inspect and modify only the existing NOVA workspace/page components and existing server route(s) that already read `nova_threads`/`nova_messages`.
- Test: history API/UI regression tests.

**Interfaces:**
- Consumes: existing `nova_threads`, `nova_messages`, existing session ownership checks.
- Produces: history list + thread selection in NOVA Workspace; no second persistence model.

- [ ] **Step 1: Write failing history tests**

Cover:
- owner can list only authorized project threads;
- selecting a thread loads its existing messages;
- an unauthorized project/thread returns a safe denial;
- empty history is a valid state;
- malformed/stale thread IDs do not crash the workspace.

- [ ] **Step 2: Run tests to verify RED**

Run only the new history tests; expected failure is the absence of the new UI/API behavior.

- [ ] **Step 3: Reuse current persistence**

Use the current canonical persistence path. Do not introduce another `threads` or `messages` table.

- [ ] **Step 4: Implement mobile/desktop behavior**

Desktop: optional narrow history rail. Mobile: sheet/drawer opened from NOVA header. Keep `/chat` full-height and avoid the dashboard shell.

- [ ] **Step 5: Verify**

Run focused tests, typecheck, lint, and build.

- [ ] **Step 6: Commit**

```bash
git add src tests
 git commit -m "feat(nova): expose durable conversation history"
```

---

### Task 4: Expose tools and connectors from the existing registry

**Files:**
- Modify existing NOVA workspace capability-picker/composer integration.
- Modify only existing capability route/registry adapters if a real capability is missing from the current contract.
- Test: capability-picker contract tests and tool routing tests.

**Interfaces:**
- Consumes: canonical capability contract and `routeHockerCapabilityRequest`.
- Produces: tool/connector picker entries whose status and permissions reflect real backend readiness.

- [ ] **Step 1: Enumerate currently real capabilities**

Generate the list from the canonical registry; no manually duplicated UI list.

- [ ] **Step 2: Write failing tests**

Assert that each displayed item has:
- stable capability key;
- real status;
- read/write mode;
- risk level;
- approval requirement;
- backend route availability.

- [ ] **Step 3: Implement only the missing presentation/route mapping**

Do not activate provider capabilities by changing status alone. A capability remains hidden/disabled when credentials or backend readiness are absent.

- [ ] **Step 4: Verify**

Run focused capability/tool tests plus typecheck, lint, build.

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat(nova): expose verified tools and connectors"
```

---

### Task 5: Add inline actions and risk-aware approval cards

**Files:**
- Reuse existing `DraftCard`, `nova-chat-types`, `nova-chat-helpers`, and existing Owner Gate/action routes.
- Test: action draft, queue-lock, approval and denial regression tests.

**Interfaces:**
- Consumes: existing action drafts, action queue, Owner Gate, AAL2 gate helpers.
- Produces: inline cards showing effect, target, actor, data, cost, permissions, rollback, expiry, evidence state; buttons are shown only when the action is actually executable and authorized.

- [ ] **Step 1: Write failing tests for R0-R4 rendering rules**

Cover:
- R0 shows result without approval;
- R1 shows reversible-action metadata;
- R2 requires contextual approval;
- R3 requires Owner Gate + AAL2;
- R4 renders reinforced review state;
- unreadable approval state fail-closes to locked/no execution.

- [ ] **Step 2: Run tests to verify RED**

Record the focused failure.

- [ ] **Step 3: Implement card mapping against current action payloads**

Never infer authorization from UI labels or tool annotations. Server policy remains authoritative.

- [ ] **Step 4: Wire approve/reject only through existing server action paths**

Do not add a direct client-side mutation path.

- [ ] **Step 5: Verify security and regression suites**

Run focused tests, full `npm test`, typecheck, lint, build.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(nova): add inline risk-aware action approvals"
```

---

### Task 6: Add uniform evidence and artifact viewer

**Files:**
- Reuse existing evidence fields from `agi_runs`, `agi_tasks`, `agi_action_queue`, and audit surfaces.
- Create only the smallest viewer components needed under `src/components/`.
- Test: evidence rendering/linkage tests.

**Interfaces:**
- Consumes: existing run/task/action evidence and result hashes.
- Produces: a single detail panel that explains what happened, when, where, outcome, hash, rollback state, and linked deployment/artifact where available.

- [ ] **Step 1: Write failing evidence tests**

Assert that an evidence record cannot render as verified without a source record and timestamp.

- [ ] **Step 2: Run tests to verify RED**

- [ ] **Step 3: Implement viewer**

Keep provider/model internals collapsed under advanced details.

- [ ] **Step 4: Add artifact preview hooks**

Only show an artifact action when an actual stored artifact exists; do not create placeholder download buttons.

- [ ] **Step 5: Verify**

Run focused tests, typecheck, lint, build.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(nova): unify evidence and artifact detail"
```

---

### Task 7: Add real files and voice only where backend capability is verified

**Files:**
- Modify capability contract/configuration only for capabilities proven real.
- Modify NOVA composer/UI to support attachment and voice state only behind verified capability status.
- Test: capability availability, upload, transcription and voice-output contracts where applicable.

**Interfaces:**
- Consumes: existing storage/integration contracts and provider adapters.
- Produces: file and voice controls that never advertise unsupported backend behavior.

- [ ] **Step 1: Inspect current file and voice infrastructure**

Record exact existing storage, endpoints, provider adapters, permission checks, retention rules and quotas.

- [ ] **Step 2: If a capability is not fully real, keep it hidden/disabled**

No UI-only promises.

- [ ] **Step 3: For a real capability, write failing end-to-end contract tests**

Cover auth, size/type validation, tenant scope, persistence, deletion/retention, transcription result ownership, and failure recovery.

- [ ] **Step 4: Implement the minimum UI**

Use a composer attachment/voice affordance only when the capability status is `ready`.

- [ ] **Step 5: Verify**

Run focused tests, typecheck, lint, build and exact Preview.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(nova): expose verified files and voice capabilities"
```

---

### Task 8: Workspace browser-level and responsive certification

**Files:**
- Modify only UI files required to fix verified defects.
- Test: browser-level e2e/accessibility tests already present plus new targeted tests.

**Interfaces:**
- Consumes: final workspace slices from Tasks 2-7.
- Produces: documented evidence across 320/360/390/430 widths, tablet, desktop, keyboard/focus, reduced motion, and supported browsers.

- [ ] **Step 1: Run current browser/e2e checks on exact candidate**

- [ ] **Step 2: Add only defect-driven tests**

Do not add snapshot tests for unstable dynamic content unless the snapshot is narrowly scoped and deterministic.

- [ ] **Step 3: Fix defects minimally**

- [ ] **Step 4: Verify with build + accessibility checks**

- [ ] **Step 5: Commit**

```bash
git add src tests docs
 git commit -m "test(nova): certify workspace responsive and accessibility gates"
```

---

### Task 9: Production promotion and continuity update

**Files:**
- Modify: `docs/operations/HANDOFF_YYYY-MM-DD.md` current handoff successor.
- Modify: `docs/operations/INDEX.md` only if the current handoff/closure pointer changes.
- Modify: `README.md`/`AGENTS.md` only when their durable instructions are actually stale.
- Test: complete applicable release gate.

**Interfaces:**
- Consumes: exact-head Preview, CI, production deployment, health/logs, security evidence.
- Produces: a single authoritative current operational pointer plus links to evidence.

- [ ] **Step 1: Re-query GitHub/Vercel/Supabase before merge**

- [ ] **Step 2: Require applicable checks green**

- [ ] **Step 3: Merge with expected head SHA**

- [ ] **Step 4: Verify production deployment resolves to merged SHA**

- [ ] **Step 5: Run health/smoke/runtime-log checks**

- [ ] **Step 6: Update only the current Markdown source of truth**

- [ ] **Step 7: Commit documentation follow-up if needed**

```bash
git add docs README.md AGENTS.md
git commit -m "docs(nova): update workspace continuity state"
```

