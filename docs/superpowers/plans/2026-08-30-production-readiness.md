# Production Readiness & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile Hocker One's operational truth with the current certified baseline, harden the shared Supabase security boundary without regressions, complete the remaining Owner/AAL2 and runtime continuity gates, then finish the product/workspace/recovery closure without invalidating the certified Core.

**Architecture:** Keep `main` protected and use branch + PR for every functional change. Treat Supabase permissions/RLS/functions, AGI runtime/Owner Gate, frontend workspace, mobile, and provider configurations as separate gates so rollback remains narrow. Preserve the certified AGI evidence under `2026.08.21-8` + `score-v5`; do not invalidate it with unrelated changes.

**Tech Stack:** Next.js 16.3.3, Node 22, Supabase/PostgreSQL 17, Vercel, GitHub Actions, Capacitor/Android, Hocker One AGI certification runner, semantic-v1 Owner Gate grading.

**Spec:** `docs/operations/INDEX.md` + canonical DOC-06/DOC-07 security/continuity contracts.

## Global Constraints

- Preserve 16/16 AGI scope certification under `2026.08.21-8` + `score-v5`.
- Keep `allow_actions=false` as the default request/runtime posture; capability-specific action requests remain Owner-Gate controlled and never imply direct execution.
- No direct writes to `main`; every functional change uses branch + PR + exact-head verification.
- No service-role, synthetic AAL2, copied cookies/tokens, or manual `agi_runs`/feedback rows as certification evidence.
- No broad grant/policy changes merely to silence Supabase Advisor warnings.
- Default database functions to `SECURITY INVOKER`; `SECURITY DEFINER` requires fixed `search_path=''`, schema-qualified references, bounded inputs and explicit minimal EXECUTE grants.
- No additional production DDL before an independently reproducible validation path is available and rollback/compensation is reviewed.
- No secret values in repository, tickets, logs, evidence packs, or shared memory.
- Treat unused-index findings as performance INFO only; do not drop indexes without workload/query-plan/dependency evidence and reversible validation.

### Task 1: Reconcile active operational documentation

**Status: COMPLETE after current-state reconciliation PR is promoted.**

**Files:**
- Modify: `AGENTS.md` only when a verified contract is stale; current version is already aligned.
- Modify: `docs/operations/INDEX.md` only when the active source pointer changes; current index is aligned.
- Maintain: `docs/operations/HANDOFF_2026-08-30.md`
- Maintain: `docs/operations/LAST_KNOWN_STATE.md`
- Maintain: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`

**Acceptance:** Active sources point to the current certification, production SHA/deployment, current Supabase migration head, NOVA/node revisions and actual open gates; historical snapshots remain historical.

- [x] Reconciled current handoff against production/main/Supabase/NOVA/node state.
- [x] Reconciled recovery card.
- [x] Reconciled platform closure gate.
- [x] Confirmed `AGENTS.md` is already current and does not require a needless edit.

### Task 2: Supabase authorization and function hardening

**Status: PARTIAL / PRIMARY RPC HARDENING COMPLETE.**

**Files:**
- Production migration already contains the targeted RPC hardening.
- Authorization tests/consumer matrix remain the evidence backlog.

**Interfaces:**
- Consumes: current production grants/RLS/function definitions and product contracts.
- Produces: least-privilege SQL changes plus explicit before/after evidence.

- [x] Audited the four reviewed RPCs for `SECURITY DEFINER`, `search_path`, ownership, bounded inputs and public/own-history behavior.
- [x] Hardened `search_path` and own-history execution mode.
- [x] Removed unnecessary `agis_public_catalog` anon/authenticated exposure.
- [x] Re-ran Security Advisor and verified the old `search_path` finding is gone.
- [ ] Reconcile remaining authenticated GraphQL-visible relations against actual consumers and tenant/RLS contracts.
- [ ] Review public `SECURITY DEFINER` RPC output/usage and retain only justified public execution.
- [ ] Complete authorization matrix evidence for anon/authenticated/owner/service role.
- [ ] Complete remaining Auth posture gate where provider setting is externally controlled.

**Validation constraint:** the current Supabase project is on Hobby and cannot create a production branch. Do not claim isolated branching exists. Use a supported populated disposable validation environment before future production DDL.

### Task 3: Owner AAL2 and Context Bridge gate

**Status: OPEN / HUMAN ACCEPTANCE.**

- [ ] Execute controlled AAL1 negative-path smoke for protected pages/APIs.
- [ ] Execute AAL2 smoke for `/api/agi/certification/run` and authorized critical surfaces.
- [ ] Verify containment/reject/cancel remain available and do not accidentally require AAL2 where policy does not require it.
- [ ] Reconcile `#166` and `#167` with actual evidence; do not retire legacy activation until the AAL2 path is proven.

### Task 4: Runtime / provider / recovery gate

**Status: PARTIAL.**

- [x] Hocker One runtime health/retry behavior is operating in production.
- [x] Certification-time transient grader/provider failures were retried without synthetic PASS.
- [ ] Verify stale-task recovery and idempotent resume semantics under controlled provider outage.
- [ ] Re-certify `nova.agi` as a real fallback with exact deployment/revision, readiness, authenticated E2E, fallback routing, persistence/telemetry and rollback evidence.
- [ ] Add/verify provider outage, malformed-output and partial-failure regression cases where missing.

### Task 5: Observability, continuity and recovery evidence

**Status: PARTIAL.**

- [x] Post-merge production health/log checks have been performed for current dependency releases.
- [x] Exact SHA/deployment provenance is tracked for current production baseline.
- [ ] Implement/verify single frontend `OperationalState` contract across NOVA/Home/AGIs/Approvals/Operation.
- [ ] Validate backup/restore for critical Tier 0/1 data without destructive production tests.
- [ ] Measure/document RPO/RTO and restore reconciliation.
- [ ] Finalize current evidence pack and rollback candidate.

### Task 6: Deferred maintenance after security gates

**Status: SUBSTANTIALLY COMPLETE FOR PRIORITED PATCHES.**

- [x] Rebase/evaluate `#294` Supabase JS.
- [x] Rebase/evaluate `#293` Lucide.
- [x] Rebuild/evaluate `#287/#300` as aligned Capacitor stack and incorporate `#285` Gradle.
- [ ] Recover `#288` only as controlled Supabase SSR/Auth compatibility work if still justified by current code/provider advisories.
- [ ] Evaluate `#296` ESLint 10 only as tooling major.
- [ ] Evaluate `#290` setup-java independently if it still has a security/maintenance benefit after current CI baseline.
- [ ] Evaluate `#301` PDFKit independently; v0.20.x contains compatibility changes and must not be bundled.

## Master-plan product/UX completion

The current `main` was audited and still does **not** satisfy the full Phase 3–6 product plan. These are real implementation tasks, not documentation-only debt.

### Phase 3 — NOVA Workspace 2.0

- [ ] Port only the useful portions of historical NOVA UX work after current-main diff review; never merge stale branches wholesale.
- [ ] Split the monolithic `NovaRealtimeChat` into clear Conversation/Composer/History/Actions/Capabilities/Detail/Evidence responsibilities.
- [ ] Implement a capability picker that only exposes capabilities that are genuinely wired and safe.
- [ ] Keep action proposals separate from execution; R0–R4 risk semantics and Owner Gate remain authoritative.
- [ ] Persist/recover chat history through the canonical Hocker path; local state is not sufficient for continuity.
- [ ] Integrate real files/voice/artifacts only when the underlying provider and storage path are verified.

### Phase 4 — Hocker One UX simplification

- [ ] Audit current Home against the five operational questions: health, attention, AGI activity, changes and cost.
- [ ] Simplify navigation and integrations while preserving advanced details behind explicit drill-down.
- [ ] Keep AGI registry compact; do not redesign the 16-card model unnecessarily.
- [ ] Reduce VFX to contextual use only.

### Phase 5 — Single state + observability/FinOps

- [ ] Create a frontend single OperationalState contract backed by canonical runtime/DB sources.
- [ ] Avoid duplicate polling loops where a single state/Realtime path can safely serve the same view.
- [ ] Surface only actionable metrics: cost, latency, errors, fallback, activity, availability and execution volume, with source/unit/period/update time.

### Phase 6 — Responsive/accessibility/device certification

- [ ] Certify 320/360/390/430 mobile, tablet, desktop, ultrawide and relevant touch/keyboard modes.
- [ ] Certify Chromium, Safari/WebKit and Firefox families.
- [ ] Validate keyboard, focus, zoom/reflow, touch targets, safe areas, reduced motion and no-content-obscured behavior.
- [ ] Produce accessible alternatives for decision-critical charts/data.
- [ ] TV remains a wallboard/monitoring surface only; never expose sensitive approval controls there.
- [ ] Target WCAG 2.2 AA for applicable surfaces.

### Phase 7 — SRE / recovery

- [ ] Backup/restore drill.
- [ ] Rollback drill.
- [ ] Provider failure / gateway failure.
- [ ] NOVA unavailable.
- [ ] DB degraded.
- [ ] stale action / duplicate execution / timeout.
- [ ] revoked credential / corrupted response / failed deployment.

### Phase 8 — Final RC

- [ ] Freeze one candidate SHA.
- [ ] Run applicable tests/security/evals/E2E/accessibility/responsive/visual/migration/rollback gates on that exact SHA.
- [ ] Exact-head Preview and production deployment must correspond to the same candidate lineage.

### Phase 9 — Final production + canon

- [ ] Merge approved RC.
- [ ] Production deployment on exact tested SHA.
- [ ] Smoke + health + runtime logs + metrics + critical functions.
- [ ] Update active handoff/closure/evidence pack and all affected canonical sources.

## Verification matrix

Every promoted functional change must have the applicable subset of: RED regression (when a bugfix), GREEN regression, typecheck, lint, build, dependency/security audit, CodeQL, exact-head Preview, production deployment, health check, runtime error/fatal review, rollback evidence, and continuity update.

## Official references used for this plan

- Supabase Database Functions: `SECURITY INVOKER` by default, `search_path=''` for `SECURITY DEFINER`, explicit EXECUTE grants.
- Supabase RLS: grants are checked before policies; exposed views require explicit security review and `security_invoker=true` where appropriate.
- Supabase Password Security: leaked-password protection through HaveIBeenPwned.
- GitHub Dependabot: grouped security/version updates per ecosystem; keep security updates enabled while grouping version maintenance.
- GitHub Actions security: least-privilege workflow permissions, SHA pinning, and OIDC for cloud auth.
- Vercel deployment operations: exact deployment verification, production log checks, and rollback to known-good deployment.
- Current project standards: OpenAI Agents SDK HITL/resume/approval patterns, MCP 2026-07-28 final specification, NIST Zero Trust, OWASP Agentic/GenAI 2026, WCAG 2.2.
