# AGI Eval Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add honest, versioned individual eval contracts for all 16 AGIs and require verified runtime evidence before Hocker One marks an individual eval complete.

**Architecture:** Keep eval definitions in code, reuse the existing `agi_feedback` evidence table, and extend the current certification snapshot rather than building a second certification service. Contract coverage and runtime evidence remain separate checks.

**Tech Stack:** Next.js 16.2.x, TypeScript, Supabase/Postgres, Node test runner, Vercel.

## Global Constraints

- Preserve `allow_actions=false` and Owner Gate boundaries.
- No new Supabase DDL in this slice.
- Do not insert synthetic eval evidence into production.
- Do not create a second AGI navigation surface.
- Runtime evidence must reference the current suite version and one verified run per case.

---

### Task 1: Version the 16 individual suite contracts

**Files:**
- Create: `src/lib/agi-eval-suites.ts`
- Test: `tests/agi-eval-suites.test.mjs`

**Interfaces:**
- Produces: `AGI_EVAL_SUITE_VERSION`, `AGI_EVAL_SUITES`, `getAgiEvalSuite(agiId)`.

- [x] **Step 1: Write a failing contract test** requiring all 16 canonical IDs, the three case kinds and fail-closed expectations.
- [x] **Step 2: Add the suite catalog** with domain-specific mission and material-action prompts plus a common evidence-fabrication probe.
- [x] **Step 3: Keep expectations machine-readable** for a later runtime runner: `must_not_execute_external_write`, `must_require_owner_gate`, `must_admit_missing_evidence`, and optional domain terms.

### Task 2: Make certification consume real eval evidence

**Files:**
- Modify: `src/lib/agi-certification.ts`
- Modify: `tests/agi-certification-matrix.test.mjs`

**Interfaces:**
- Consumes: `getAgiEvalSuite()` and existing `public.agi_feedback`.
- Produces: checks `eval_contract_suite` and `individual_eval_suite` plus `eval_suite_version` in the snapshot.

- [x] **Step 1: Extend the certification test** so runtime certification requires `agi_eval_result`, current `suite_version`, complete case counts and `evidence_run_ids`.
- [x] **Step 2: Query existing feedback fail-closed** and treat query errors as partial certification evidence.
- [x] **Step 3: Accept only current complete evidence**; malformed/stale payloads do not pass.
- [x] **Step 4: Keep certification incomplete** until all checks pass.

### Task 3: Surface the evidence distinction without adding navigation

**Files:**
- Modify: `src/app/agis/page.tsx`

**Interfaces:**
- Consumes: updated certification snapshot.

- [x] **Step 1: Add labels** `eval contractual` and `eval runtime`.
- [x] **Step 2: Display the current suite version** in the existing criteria panel.
- [x] **Step 3: Preserve the existing `/agis` route and card layout**.

### Task 4: Verify the candidate before promotion

**Files:**
- No additional production code.

- [ ] **Step 1: Run exact-head repository CI** and require tests, lint, typecheck, build and dependency audit success.
- [ ] **Step 2: Require exact-head Vercel Preview READY** and inspect build/runtime errors.
- [ ] **Step 3: Review PR diff and review threads**; resolve any evidence or security finding.
- [ ] **Step 4: Merge only with `expected_head_sha` if `main` has not moved.**
- [ ] **Step 5: Revalidate production** on the merged SHA before starting the runtime-eval runner slice.
