# Production Readiness & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile Hocker One's operational truth with the current certified baseline, harden the shared Supabase security boundary without regressions, complete the remaining Owner/AAL2 and runtime continuity gates, then resume dependency/mobile maintenance only after the security gates are green.

**Architecture:** Keep `main` protected and use branch + PR for every functional change. Treat Supabase permissions/RLS/functions, AGI runtime/Owner Gate, and provider configurations as separate gates so rollback remains narrow. Preserve the certified AGI evidence under `2026.08.21-8` + `score-v5`; do not invalidate it with unrelated changes.

**Tech Stack:** Next.js 16.3.3, Node 22, Supabase/PostgreSQL 17, Vercel, GitHub Actions, Capacitor/Android, Hocker One AGI certification runner, semantic-v1 Owner Gate grading.

**Spec:** `docs/operations/INDEX.md` + canonical DOC-06/DOC-07 security/continuity contracts.

## Global Constraints

- Preserve 16/16 AGI scope certification under `2026.08.21-8` + `score-v5`.
- Keep `allow_actions=false` for all 16 AGIs unless a versioned capability-specific exception is explicitly approved.
- No direct writes to `main`; every functional change uses branch + PR + exact-head verification.
- No service-role, synthetic AAL2, copied cookies/tokens, or manual `agi_runs`/feedback rows as certification evidence.
- No broad grant/policy changes merely to silence Supabase Advisor warnings.
- Default database functions to `SECURITY INVOKER`; `SECURITY DEFINER` requires fixed `search_path=''`, schema-qualified references, and explicit minimal EXECUTE grants.
- No production DDL before isolated validation, authorization tests, Advisor recheck, and rollback evidence.
- No secret values in repository, tickets, logs, evidence packs, or shared memory.
- Treat unused-index findings as performance INFO only; do not drop indexes without workload/query-plan/dependency evidence and reversible validation.

### Task 1: Reconcile active operational documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/operations/INDEX.md`
- Create: `docs/operations/HANDOFF_2026-08-30.md`
- Modify: `docs/operations/LAST_KNOWN_STATE.md`
- Create: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`

**Acceptance:** Current source points to `score-v5`, `2026.08.21-8`, completed `#303`, open `#306`, and the actual production/Supabase state; historical 2026-08-19 docs remain preserved.

- [ ] Create the new handoff with exact current baseline, completed certification, current production SHA/deployment, known open gates, and recovery order.
- [ ] Create the new closure gate for `production_ready` with explicit gate statuses and evidence requirements.
- [ ] Update `INDEX.md` so the new handoff/closure are the only active sources for their purposes.
- [ ] Update `LAST_KNOWN_STATE.md` to point to the new active handoff/closure and label the old snapshot historical.
- [ ] Update `AGENTS.md`'s stale score-v3 certification wording to the current contract.

### Task 2: Supabase authorization and function hardening

**Files:**
- Create: targeted SQL migration under `supabase/migrations/` only after isolated validation
- Create: authorization regression tests under `supabase/tests/`
- Modify: relevant application consumers only if the audited output contract requires it

**Interfaces:**
- Consumes: current production grants/RLS/function definitions and product contracts.
- Produces: least-privilege SQL changes plus explicit before/after evidence.

- [ ] Create a disposable Supabase development branch after cost confirmation.
- [ ] Reconcile the 25 authenticated GraphQL-visible relations against current product contracts; do not revoke intentional read access where RLS is the row boundary.
- [ ] Reconcile the four anonymous public surfaces (`agis_public_catalog`, `cashback_tiers`, `free_round_tiers`, `promo_offers`) against their documented public contract.
- [ ] Audit `get_public_leaderboard`, `get_public_recent_wins`, `get_my_crash_history`, and `get_my_slot_history` for `SECURITY DEFINER`, fixed search path, role grants, bounded inputs, and returned fields.
- [ ] Remove any secret/game-fairness fields from own-history RPC outputs if they are not required by an audited consumer; preserve hashes/verification artifacts as needed.
- [ ] Add negative authorization cases for anon, authenticated non-owner, authenticated owner, and service role.
- [ ] Run Security Advisor before and after; classify remaining warnings as intentional with evidence or remediated.
- [ ] Apply production migration only after all branch tests are green and rollback SQL is reviewed.

### Task 3: Owner AAL2 and Context Bridge gate

**Files:**
- Modify/create only files required by the existing Context Bridge activation contract and tests.

- [ ] Execute controlled AAL1 negative-path smoke for protected pages/APIs.
- [ ] Execute AAL2 smoke for `/api/agi/certification/run` and authorized critical surfaces.
- [ ] Verify containment/reject/cancel remain available and do not accidentally require AAL2 when the policy does not require it.
- [ ] Reconcile `#166` and `#167` with actual evidence; do not retire legacy activation until the AAL2 path is proven.

### Task 4: Runtime / provider / recovery gate

**Files:**
- Modify only runtime/router/test files required by verified failures.

- [ ] Verify Hocker One runtime health and retry/fallback behavior using read-only diagnostics.
- [ ] Verify stale-task recovery and idempotent resume semantics for provider outages.
- [ ] Re-certify `nova.agi` as a real fallback only with exact deployment/revision, readiness, logs, authenticated E2E, fallback routing, persistence/telemetry, and rollback evidence.
- [ ] Add provider outage/malformed-output/partial-failure regression cases where missing.

### Task 5: Observability, continuity and recovery evidence

- [ ] Verify production error/fatal logs after each promoted change.
- [ ] Record exact SHA/deployment IDs, evidence hashes, rollback target, and time window.
- [ ] Validate backup/restore objectives for critical Tier 0/1 data without modifying production data.
- [ ] Update the single active closure/handoff rather than duplicating status across Markdown files.

### Task 6: Deferred maintenance after security gates

- [ ] Rebase/evaluate `#294` Supabase JS.
- [ ] Rebase/evaluate `#293` Lucide.
- [ ] Rebuild `#287/#300` as an aligned Capacitor stack and evaluate `#285` Gradle in the same Android gate.
- [ ] Recover `#288` only as controlled Supabase SSR/Auth compatibility work.
- [ ] Evaluate `#296` ESLint 10 only as tooling major.
- [ ] Evaluate `#290` setup-java and `#301` PDFKit independently.
- [ ] Keep Chido #32 ahead of #53 and do not mix real-money/game flow changes with dependency remediation.

## Verification matrix

Every promoted functional change must have the applicable subset of: RED regression (when a bugfix), GREEN regression, typecheck, lint, build, dependency/security audit, CodeQL, exact-head Preview, production deployment, health check, runtime error/fatal review, and rollback evidence.

## Official references used for this plan

- Supabase Database Functions: `SECURITY INVOKER` by default, `search_path=''` for `SECURITY DEFINER`, explicit EXECUTE grants.
- Supabase RLS: grants are checked before policies; exposed views require explicit security review and `security_invoker=true` where appropriate.
- Supabase Password Security: leaked-password protection through HaveIBeenPwned.
- GitHub Dependabot: grouped security/version updates per ecosystem; keep security updates enabled while grouping version maintenance.
- GitHub Actions security: least-privilege workflow permissions, SHA pinning, and OIDC for cloud auth.
- Vercel deployment operations: exact deployment verification, production log checks, and rollback to known-good deployment.
