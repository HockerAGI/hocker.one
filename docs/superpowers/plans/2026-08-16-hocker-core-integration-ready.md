# HOCKER Core Integration Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Hocker One + NOVA + the 16 canonical AGIs as an evidence-backed, fail-closed integration platform for downstream HOCKER apps without claiming completion for unrelated regulated product capabilities.

**Architecture:** Preserve Hocker One as the governed control plane, Context Bridge as append-only operational continuity, Memory Mirror as reviewed reusable learning, and Supabase/Vercel/GitHub as observable provider state. Near-real-time continuity is milestone/event driven; Vercel Hobby cron remains a once-daily reconciliation backstop. No active historical manifest is rewritten and no material AGI action is enabled to satisfy certification.

**Tech Stack:** Next.js 16, TypeScript 5.9, Node 22, Supabase Postgres/Auth/RLS, Vercel Functions/Cron, GitHub Actions/branch protection, Capacitor Android.

## Global Constraints

- Truth order: production/configuration > `main`/migrations > executable contracts/tests > approved policies/ADRs > canonical documents > conversation/history.
- `main` remains PR-gated; exact-head CI and applicable preview/runtime evidence are required before merge.
- All 16 canonical AGIs remain `allow_actions=false` unless a separately scoped Owner-approved capability explicitly requires otherwise.
- Context Bridge checkpoints may update at material milestones; manifests remain immutable snapshots and activate only via human Owner + MFA AAL2.
- Memory Mirror never receives raw chats, credentials, TOTP/KYC/PII, or unreviewed operational state.
- Vercel Hobby cron remains at most daily; do not simulate minute-level polling.
- Supabase `MIGRATIONS_FAILED` is diagnosed from migration/log evidence; no blind reset/rebase.
- Casino/wallet/KYC/regulated functionality remains outside this core closure unless separately authorized.

---

### Task 1: Fail-closed Context Bridge coverage

**Files:**
- Create: `src/lib/context-bridge-coverage.ts`
- Modify: `src/lib/context-bridge.ts`
- Modify: `tests/context-bridge-v1.test.mjs`

**Interfaces:**
- Produces: `deriveProviderCoverageStatus({ checkpointObservedAt, staleBefore, capabilities })` returning `complete | partial | missing | stale | blocked`.
- `createContextBridgeManifest()` must use the status derived from the newest checkpoint's own source capabilities.

- [ ] Add a RED test proving a fresh checkpoint with only `partial` capability evidence is not `complete`.
- [ ] Add a RED test proving a fresh current `blocked` capability produces `blocked` coverage.
- [ ] Add a RED test proving fresh `verified` capability evidence can produce `complete`.
- [ ] Run the Context Bridge test and confirm the missing helper fails for the expected reason.
- [ ] Implement the pure coverage helper and wire it into manifest generation before coverage is persisted.
- [ ] Run Context Bridge tests, full tests, typecheck, lint, build and dependency audit.

### Task 2: Context/memory freshness operating contract

**Files:**
- Create: `docs/operations/CONTEXT_FRESHNESS_POLICY.md`
- Modify: `docs/operations/CONTEXT_BRIDGE_V1.md`
- Modify: `docs/operations/CONTINUITY_PROTOCOL.md`
- Modify: `docs/operations/LAST_KNOWN_STATE.md`
- Modify: `tests/project-continuity.test.mjs`

**Interfaces:**
- Produces: explicit freshness semantics for GitHub/Supabase/Vercel, ChatGPT/Codex, Google Drive and Memory Mirror.

- [ ] Add source-contract tests requiring milestone checkpoints, daily Vercel backstop, GitHub App/webhook target, Drive change-watch target, immutable manifests and reviewed-only Memory Mirror publication.
- [ ] Update the operating docs with current production SHA/deployment, current source freshness, v3 draft blockers and Memory Mirror evidence.
- [ ] Record that Google Drive remains `partial/stale` until the editable canonical source set is positively identified or a renewable change-watch adapter exists.
- [ ] Record that credential documents are explicitly excluded from Context Bridge and Memory Mirror.
- [ ] Run continuity/context tests.

### Task 3: Refresh production Context Bridge state without activation

**Provider state:** Supabase project `yvuibbcuntqpyqiuqggd`.

- [ ] Re-read all nine repository default heads and relevant open PR heads.
- [ ] Re-read Hocker One production deployment exact SHA/state and runtime error evidence.
- [ ] Re-read the 16-AGI guarded/evidence matrix and current Supabase security/migration state.
- [ ] Write normalized idempotent checkpoints for directly observed GitHub, Supabase, Vercel and current ChatGPT handoff evidence.
- [ ] Do not fabricate a current Codex or Google Drive canonical checkpoint when direct evidence is incomplete.
- [ ] Create a new draft manifest from the refreshed evidence set only after coverage semantics are fail-closed.
- [ ] Leave the draft inactive until every required domain is complete and a human Owner AAL2 approval exists.

### Task 4: Reconcile the durable development ledger and platform closure gate

**Files/PRs:**
- PR #215 `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`
- PR #209 platform closure gate

- [ ] Refresh the ledger against current nine-repository/provider state; correct CHIDO Games #9/#10 to merged and record #214 production rollout.
- [ ] Refresh #209 blockers against current main and Supabase evidence; remove only blockers demonstrably closed.
- [ ] Preserve open AAL2, AGI certification, Supabase global security, migration-branch, Android exact-SHA and dedicated NOVA evidence gates where still unsupported.
- [ ] Run exact-head checks/preview before either document is promoted.

### Task 5: AGI certification evidence closure

**Files:**
- Inspect/extend `src/lib/agi-certification.ts`, runtime eval/tool-eval runners and versioned Supabase migrations only through TDD.

- [ ] Map the existing eight certification gates to actual persisted evidence sources and identify any missing durable table/RPC contract.
- [ ] If durable eval evidence storage is absent, add versioned service-only tables/RPCs with RLS/grants and idempotent evidence keys through a validation project first.
- [ ] Run individual versioned evals for all 16 AGIs through the governed Owner+AAL2 path; never insert passing evidence manually.
- [ ] Run required read-only tool probes for enabled assignments; preserve material actions fail-closed.
- [ ] Require 16/16 current-scope certification evidence before marking the core integration-ready gate complete.

### Task 6: Supabase security and migration-state reconciliation

- [ ] Classify every current Security Advisor WARN/INFO by object and intended exposure.
- [ ] Prepare least-privilege migrations for unintended authenticated/anon GraphQL exposure, SECURITY DEFINER execution and duplicate permissive policies; validate before production.
- [ ] Preserve intentionally public catalog/feed contracts only with explicit column/row scope.
- [ ] Add covering indexes for currently proven unindexed AGI FKs only after query/constraint verification; do not delete indexes just because they are currently unused.
- [ ] Diagnose default-branch `MIGRATIONS_FAILED` from branching logs/history and migration provenance; no destructive reset.
- [ ] Enable leaked-password protection if plan/account support and Auth regression evidence allow it.

### Task 7: Runtime and supply-chain closure

- [ ] Verify dedicated `nova.agi` exact live revision + `/health/ready` + logs/heartbeat + authenticated Hocker One→NOVA fallback E2E, or formally classify it as non-required fallback for this release.
- [ ] Verify `hocker-node-agent` exact main SHA, CI, HMAC/allowlist/non-root/sandbox posture and one authorized request→execution→evidence cycle.
- [ ] Reconcile GitHub rulesets/branch protection, pinned Actions, dependency automation and code-scanning/SAST coverage for the integration-critical repositories.
- [ ] Keep major dependency PRs out of main when exact preview/build evidence is failing.

### Task 8: Frozen integration-ready candidate

- [ ] Rebase/resolve Hocker One UI PR #213 only after core backend gates are stable; do not let visual work overwrite #214 runtime/security changes.
- [ ] Freeze one candidate SHA/configuration set.
- [ ] Require GitHub CI, Vercel production/preview smoke, Supabase advisors/classifications, 16/16 AGI evidence, Owner AAL2, PWA and Android API 36 exact-SHA evidence, rollback/runbooks and fresh Context Bridge checkpoints.
- [ ] Create a final release-scope draft manifest from that frozen evidence set.
- [ ] Activate only via human Owner + MFA AAL2 after coverage is complete.
- [ ] Declare `HOCKER Core — VERIFIED / INTEGRATION READY` only when every named gate has traceable evidence.
