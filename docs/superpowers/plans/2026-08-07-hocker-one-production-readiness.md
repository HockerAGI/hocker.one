# Hocker One Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove launch-blocking authorization, execution-race, mobile-readiness, supply-chain and platform-hardening gaps without changing production until every release gate is green.

**Architecture:** Keep `agi_action_queue` as the canonical guarded execution path and fail closed around the legacy `commands` compatibility path. Production changes are prepared in GitHub first, database changes remain versioned migrations until an isolated Supabase validation environment is approved, and Vercel is used only for Preview/RC validation before any production promotion.

**Tech Stack:** Next.js 16.2.12, React 19.2.7, Node.js 22, TypeScript 5.9, Supabase/Postgres 17, Capacitor 8.3.1, Android, Vercel, GitHub Actions.

## Global Constraints

- Do not write directly to `main`.
- Do not apply DDL to Supabase production during implementation.
- Do not deploy Vercel production during implementation.
- Do not publish to Google Play during implementation.
- Hocker One remains `allow_write=false` until the action-governance gate is proven.
- R3/R4 actions require Owner Gate; client input can never downgrade server-side approval requirements.
- Every queue claim must prove ownership atomically before any side effect.
- Secrets are aliases only in code/docs; no secret values in repository, logs, tests or artifacts.
- Android release target is API 36 for the 2026 launch candidate.
- Every behavior change follows test-first RED -> GREEN -> refactor.

---

### Task 1: Fail-closed legacy command approval

**Files:**
- Create: `src/lib/legacy-command-policy.ts`
- Modify: `src/app/api/commands/route.ts`
- Test: `tests/legacy-command-governance.test.mjs`

**Interfaces:**
- Consumes: canonical command names from `src/lib/validators.ts`.
- Produces: `getLegacyCommandPolicy(command, role)` returning a server-owned approval decision and risk classification.

- [ ] **Step 1: Write failing tests proving request-controlled `needs_approval` is rejected as an authority source.**
- [ ] **Step 2: Run PR CI and confirm RED for the expected governance assertion.**
- [ ] **Step 3: Implement a server-side command policy. Read-only diagnostic commands may queue automatically; all mutation/external/destructive commands require Owner Gate.**
- [ ] **Step 4: Re-run tests and confirm GREEN.**
- [ ] **Step 5: Commit the task.**

### Task 2: Atomic legacy Cloud Executor claim

**Files:**
- Modify: `src/app/api/commands/_cloud.ts`
- Test: `tests/legacy-command-governance.test.mjs`

**Interfaces:**
- Consumes: a queued command id and project id.
- Produces: exactly one claimed row or an explicit non-claim result; no side effect runs without a returned claim.

- [ ] **Step 1: Add a failing regression test requiring the conditional UPDATE to return the claimed row.**
- [ ] **Step 2: Run PR CI and confirm RED.**
- [ ] **Step 3: Change the claim to conditional UPDATE + `select(...).maybeSingle()` and abort when no row is returned.**
- [ ] **Step 4: Re-run tests and confirm GREEN.**
- [ ] **Step 5: Commit the task.**

### Task 3: Remove operator write authority on legacy commands

**Files:**
- Create: `supabase/migrations/20260807_hocker_one_commands_owner_gate_hardening.sql`
- Test: `tests/legacy-command-governance.test.mjs`

**Interfaces:**
- Consumes: existing `project_members` and `commands` table.
- Produces: owner/admin-only write policy while preserving authorized read access required by the UI.

- [ ] **Step 1: Add a failing migration-contract test requiring owner/admin-only write semantics and explicit operator non-write coverage.**
- [ ] **Step 2: Run PR CI and confirm RED.**
- [ ] **Step 3: Add a new narrowly scoped authorization helper/policy without changing production yet.**
- [ ] **Step 4: Re-run tests and static SQL checks; keep migration unapplied until Supabase sandbox validation.**
- [ ] **Step 5: Commit the task.**

### Task 4: Separate signing secrets from internal API bearer credentials

**Files:**
- Modify: `src/lib/hocker-owner-api-gate.ts`
- Modify affected internal callers only if required.
- Test: `tests/owner-api-secret-separation.test.mjs`

**Interfaces:**
- Consumes: `HOCKER_OWNER_ACTION_KEY`, `HOCKER_ONE_INTERNAL_TOKEN`, `NOVA_ORCHESTRATOR_KEY`.
- Produces: owner/internal authentication that never accepts HMAC signing keys as bearer credentials.

- [ ] **Step 1: Add failing test proving `HOCKER_COMMAND_HMAC_SECRET` and `COMMAND_HMAC_SECRET` are not accepted authentication sources.**
- [ ] **Step 2: Run PR CI and confirm RED.**
- [ ] **Step 3: Remove signing secrets from auth-token candidates; fail closed if no dedicated internal token exists.**
- [ ] **Step 4: Re-run full tests and build.**
- [ ] **Step 5: Commit the task.**

### Task 5: Route-guard coverage

**Files:**
- Modify/create: `tests/private-session-guard.test.mjs`
- Modify route layouts only if the test discovers an unguarded private surface.

**Interfaces:**
- Consumes: App Router private route inventory.
- Produces: regression coverage that rejects any newly introduced private page without a session gate.

- [ ] **Step 1: Expand the route inventory assertion and confirm any real gap fails.**
- [ ] **Step 2: Add missing guard only where demonstrated.**
- [ ] **Step 3: Re-run test suite and build.**
- [ ] **Step 4: Commit the task.**

### Task 6: Android 2026 launch baseline

**Files:**
- Modify: `android/variables.gradle`
- Modify Android Gradle/JDK configuration only as required by the selected Capacitor 8-compatible toolchain.
- Modify: `tests/android-bootstrap-security.test.mjs`
- Modify: `tests/android-release-signing.test.mjs`

**Interfaces:**
- Consumes: Capacitor 8 Android project.
- Produces: target/compile API 36 release candidate with existing signing and cleartext protections intact.

- [ ] **Step 1: Add failing test requiring API 36.**
- [ ] **Step 2: Update compatible Android toolchain values.**
- [ ] **Step 3: Run Android debug/release verification in CI.**
- [ ] **Step 4: Test phone, foldable, 8-inch tablet, 10.5-inch tablet and 13-inch Chromebook profiles before GA.**
- [ ] **Step 5: Commit the task.**

### Task 7: PWA reliability and identity

**Files:**
- Modify: `src/app/manifest.ts`
- Create service-worker/offline support only after defining the exact data that may be cached.
- Test: PWA manifest/offline contract tests.

**Interfaces:**
- Consumes: authenticated Hocker One web shell.
- Produces: stable PWA identity and explicit safe offline/degraded behavior that never caches secrets or sensitive API responses.

- [ ] **Step 1: Add tests for manifest identity/start route and no sensitive caching.**
- [ ] **Step 2: Add stable manifest `id` and reconcile `start_url` with the canonical shell.**
- [ ] **Step 3: Implement a minimal offline shell only if it can remain fail-closed for authenticated data.**
- [ ] **Step 4: Validate installability and offline/degraded UX in Preview.**
- [ ] **Step 5: Commit the task.**

### Task 8: GitHub supply-chain hardening

**Files:**
- Add/modify: `.github/CODEOWNERS`, `.github/dependabot.yml`, `SECURITY.md`, CodeQL workflow and existing workflows as evidence requires.
- Test: repository policy/source checks.

**Interfaces:**
- Consumes: existing GitHub Actions and public repository posture.
- Produces: required reviews/checks, dependency updates, SAST and immutable third-party action pins where applicable.

- [ ] **Step 1: Inventory all workflows/actions and existing security files.**
- [ ] **Step 2: Add failing source-policy tests for demonstrated gaps.**
- [ ] **Step 3: Add the minimum hardening configuration and pin third-party actions to immutable commit SHAs where supported.**
- [ ] **Step 4: Verify Actions and CodeQL results on the draft PR.**
- [ ] **Step 5: Commit the task.**

### Task 9: Supabase isolated validation

**Files:**
- Use versioned migrations from this branch; no direct production DDL.

**Interfaces:**
- Consumes: approved branch cost/validation environment.
- Produces: authorization, migration, security-advisor and rollback evidence.

- [ ] **Step 1: Obtain branch cost and explicit cost confirmation before creating a Supabase development branch, unless an existing validation environment is formally selected.**
- [ ] **Step 2: Apply branch migrations only.**
- [ ] **Step 3: Run anon/authenticated/owner/admin/operator/service-role authorization matrix.**
- [ ] **Step 4: Run security/performance advisors and record residual findings.**
- [ ] **Step 5: Reset/rebase/retest to prove reproducibility.**

### Task 10: Vercel Preview release candidate

**Files:**
- No production deployment.

**Interfaces:**
- Consumes: draft PR/branch and validated environment variables.
- Produces: Preview deployment evidence, build/runtime/accessibility/performance results and rollback candidate.

- [ ] **Step 1: Verify draft PR Preview deploy.**
- [ ] **Step 2: Run smoke/E2E/accessibility/performance/security-header checks.**
- [ ] **Step 3: Inspect runtime/build errors and logs.**
- [ ] **Step 4: Keep Production untouched until all gates are green.**

### Task 11: Production-readiness gate

**Files:**
- Create: `docs/operations/HOCKER_ONE_PRODUCTION_READINESS_2026-08.md`

**Interfaces:**
- Consumes: all evidence from Tasks 1-10.
- Produces: GO / CONDITIONAL GO / NO-GO decision with exact blockers, SHAs, migrations, deployment IDs, test evidence and rollback.

- [ ] **Step 1: Record zero-open-P0/P1 requirement and residual P2/P3 decisions.**
- [ ] **Step 2: Record dependency/security/Supabase/Android/PWA/Vercel evidence.**
- [ ] **Step 3: Record legal/compliance and operational gates separately from technical readiness.**
- [ ] **Step 4: Do not promote production without an explicit final GO.**
