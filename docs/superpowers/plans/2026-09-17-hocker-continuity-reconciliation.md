# HOCKER Continuity Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reproducible repository truth against the live Supabase migration ledger, rebuild Work Session on the current `main`, and reconcile the dependency queue without modifying production until all gates are green.

**Architecture:** Migration provenance is repaired first and contains only evidence-backed historical migration files plus a live-ledger regression contract. Work Session is then rebuilt from the reconciled head as a bounded feature slice using existing project/membership/operator/AGI/action primitives. Dependency upgrades and NOVA #50 remain independent gates; production is the final promotion step.

**Tech Stack:** GitHub branches/PRs, Next.js/TypeScript, Supabase/PostgreSQL migrations/RLS, Node test runner, GitHub Actions, Vercel previews.

**Spec:** `docs/superpowers/specs/2026-09-16-hocker-continuity-reconciliation.md`

## Global Constraints

- Never reset, force-push, or directly modify `main`.
- Never re-apply a migration already present in the production Supabase ledger.
- Recover historical migration SQL from original PR/commit provenance; never reconstruct SQL from memory.
- Use exact current `main` SHAs as branch bases and verification anchors.
- Merge only after exact-head required CI and relevant Preview validation are green.
- Keep Work Session isolated from new queues, memory stores, runtime routers, and duplicate AGI payloads.
- Production promotion is last and requires SHA-specific post-deploy verification.

---

### Task 1: Establish the live migration drift register

**Files:**
- Create: `docs/operations/MIGRATION_PROVENANCE_2026-09-17.md`
- Modify: `tests/supabase-migration-ledger.test.mjs` only after the drift is reproduced

**Interfaces:**
- Consumes: production project `yvuibbcuntqpyqiuqggd` migration ledger and current `main`.
- Produces: exact remote version set and provenance map for every remote version not represented by the current repository filename/version prefix.

- [ ] **Step 1: Capture the complete production ledger**
Record every production migration version returned by Supabase, with special attention to `20260830151252`, `20260830153247`, `20260901063237`, `20260902225257`, and `20260903182025`.

- [ ] **Step 2: Enumerate current repository migrations**
Read `supabase/migrations` from the exact branch base `a8d50c3ce9037e6655fb7c5f4ed89052d11d9a52`. Build a version-prefix set and identify absent remote versions and differently named equivalents.

- [ ] **Step 3: Reproduce the stale-ledger failure**
Run the existing migration-ledger regression unchanged. Capture which versions it reports missing/duplicate. Do not weaken the test.

- [ ] **Step 4: Recover provenance for each discrepancy**
Search GitHub PRs and commits by exact migration name/version. Fetch the original changed-file patch and commit metadata. A version remains unresolved if its SQL cannot be proven from repository history.

- [ ] **Step 5: Write the evidence register**
For each discrepant version record: production version, production name, repository path if present, source PR/commit, content equivalence status, and action required.

- [ ] **Step 6: Commit the evidence register**
Commit only the provenance document on this branch.

---

### Task 2: Restore repository representation of already-applied migrations

**Files:**
- Create or rename only the exact migration files required to represent production-applied history.
- Do not modify unrelated application code.

**Interfaces:**
- Consumes: Task 1 provenance evidence.
- Produces: one deterministic repository representation per production version without executing production DDL.

- [ ] **Step 1: Recover exact SQL before every write**
Fetch the complete source patch for each unresolved migration. Do not derive SQL from documentation summaries.

- [ ] **Step 2: Reconcile `20260830151252`**
Determine whether the current repository file `20260830030000_security_definer_rpc_hardening.sql` is the exact SQL applied under production version `20260830151252`. Preserve semantics; use the exact production version filename only if provenance establishes that mapping.

- [ ] **Step 3: Reconcile `20260830153247`**
Locate the originating commit/PR for `revoke_dead_public_agi_catalog_view_grants` and recover its exact SQL.

- [ ] **Step 4: Reconcile `20260901063237` and `20260902225257`**
Recover the original operational-event-fabric and rollback migration SQL from Git history and establish their repository lineage.

- [ ] **Step 5: Reconcile `20260903182025`**
Compare the production version with the current `20260904120000_align_queue_orphan_view_with_reconciler.sql` and its source PR #325. Preserve the exact SQL; do not replay it in production.

- [ ] **Step 6: Run migration-ledger regression**
Require zero missing production versions and zero duplicate version prefixes before moving on.

- [ ] **Step 7: Commit the provenance repair**
Commit only evidence-backed migration representation and the provenance register.

---

### Task 3: Make the ledger regression reproducible

**Files:**
- Modify: `tests/supabase-migration-ledger.test.mjs`
- Modify: `docs/operations/MIGRATION_PROVENANCE_2026-09-17.md`

**Interfaces:**
- Consumes: live ledger captured in Task 1.
- Produces: a test that detects missing or duplicate production version prefixes without silently dropping historical versions.

- [ ] **Step 1: Add the first proven missing version to the fixture**
Use the exact live version, run only the ledger test, and verify the expected failure is due to repository absence.

- [ ] **Step 2: Add every remaining proven production version**
Update the fixture from the live ledger, retaining all previously verified versions.

- [ ] **Step 3: Run the focused ledger regression**
Require PASS with no missing or duplicate production versions.

- [ ] **Step 4: Inspect the diff for execution side effects**
Confirm only tests/documentation/history representation changed; no migration runner or production deployment behavior was altered.

- [ ] **Step 5: Run the repository's migration-related test set**
Require all relevant migration/authorization regressions to pass.

- [ ] **Step 6: Commit the green contract**
Use a focused commit such as `test(db): reconcile production migration ledger provenance`.

---

### Task 4: Rebuild Work Session from the reconciled main

**Files:**
- Modify/create only the Work Session migration, store implementation, and Work Session tests carried by PR #371 after audit.
- Do not carry unrelated #371 changes.

**Interfaces:**
- Consumes: green provenance branch head and PR #371 source patch.
- Produces: a fresh Work Session PR based on current reconciled main.

- [ ] **Step 1: Fetch PR #371 changed filenames and patches**
Inventory every changed file and retain only files belonging to Work Session.

- [ ] **Step 2: Audit the RPC contract**
Verify security invoker, fixed search_path, explicit grants, project authority, membership/operator authorization, foreign-key references, idempotency, row locking, version increments, and append-only event sequencing.

- [ ] **Step 3: Write a failing identity-binding regression**
Prove that a caller cannot create or transition a Work Session for another user merely by supplying a different `created_by` or actor identifier when the authorization contract requires `auth.uid()` binding.

- [ ] **Step 4: Run the focused test against the audited implementation**
Require a red result if the identified identity-binding gap exists.

- [ ] **Step 5: Apply the minimum authorization correction**
Change only the RPC/store contract required by the failing regression.

- [ ] **Step 6: Run Work Session focused tests**
Require lifecycle, idempotency, invalid transition, concurrency/versioning, event order, FK, and project-authority coverage.

- [ ] **Step 7: Run full repository gates**
Run typecheck, lint, tests/regressions, build, and audit commands used by the Hocker One CI workflow.

- [ ] **Step 8: Create the fresh PR**
Base it on the reconciled current main lineage. Do not retarget the stale #371 history if a clean branch is safer.

---

### Task 5: Reconcile Hocker One dependency PRs

**Files:**
- `package.json`
- `package-lock.json`
- `.github/workflows/*) only for an action dependency actually used
- Existing compatibility tests only when the release genuinely changes the contract

**Interfaces:**
- Consumes: reconciled main and open PRs #355, #356, #357, #358, #359, #372.
- Produces: individually green dependency PRs or explicit stale-branch closure/recreation.

- [ ] **Step 1: Re-audit every PR against current main**
Check actual head SHA, base SHA, changed files, lockfile, required checks, and branch freshness.

- [ ] **Step 2: Validate Next 16.3.4**
Verify the required `sharp` compatibility floor from the official Next release and the repository lockfile before accepting #355.

- [ ] **Step 3: Validate Capacitor 8.5.2**
Run the relevant web/mobile and native checks without broadening the runtime scope.

- [ ] **Step 4: Validate PostCSS 8.5.28**
Ensure the existing regression test expresses the intended supported version rather than merely being weakened.

- [ ] **Step 5: Validate @types/node 26.4.1**
Confirm TypeScript compatibility and keep runtime Node assumptions unchanged.

- [ ] **Step 6: Reconcile Supabase JS 2.116.0**
Confirm whether the upgrade is already present in current main; avoid duplicate or stale Dependabot work.

- [ ] **Step 7: Validate setup-java 6.0.1**
Search all workflow consumers and run the exact workflow checks on the updated branch.

- [ ] **Step 8: Recreate stale Dependabot branches**
Prefer a clean Dependabot rebase/recreation over accumulating patches against obsolete bases.

---

### Task 6: Resolve NOVA AGI #50 from actual pdfkit usage

**Files:**
- NOVA `package.json`
- NOVA `package-lock.json`
- NOVA `.github/workflows/ci.yml`
- PDF generation source/tests only if compatibility evidence requires code changes

**Interfaces:**
- Consumes: NOVA current main and #50 head.
- Produces: a green pdfkit 0.20.2 upgrade or evidence-backed decision to retain 0.19.1.

- [ ] **Step 1: Inventory actual pdfkit usage**
Search imports and runtime paths for CommonJS/ESM assumptions, virtual-fs, standard fonts, browser imports, and named exports.

- [ ] **Step 2: Reproduce the current CI failure**
Run the exact dependency-remediation contract before editing it.

- [ ] **Step 3: Compare usage with pdfkit 0.20.2 release behavior**
Use upstream release documentation and the actual Nova import/build paths.

- [ ] **Step 4: Add a focused compatibility regression if needed**
The test must reproduce the incompatible behavior before any production-code correction.

- [ ] **Step 5: Apply one minimum correction**
Update the dependency/CI contract only if the actual application is compatible and 0.20.2 is the intended supported version.

- [ ] **Step 6: Run full Nova validation**
Require typecheck, tests, build, audit, and exact-head workflow success.

---

### Task 7: Promotion and closure gate

**Files:**
- Continuity/release evidence documentation only.
- No direct main edits.

**Interfaces:**
- Consumes: green PR heads, exact merge SHAs, Preview evidence, and Supabase validation evidence.
- Produces: controlled production promotion and SHA-specific post-deploy evidence.

- [ ] **Step 1: Verify every relevant PR on its exact current head**
No title-based assumptions; inspect actual SHA and required checks.

- [ ] **Step 2: Merge in dependency-safe order**
Provenance first, Work Session second, then independent dependency upgrades whose checks remain green after each base movement.

- [ ] **Step 3: Verify Vercel production SHA**
Confirm production resolves to the expected merged main commit.

- [ ] **Step 4: Verify Supabase migration state**
Confirm historical reconciled versions were not replayed and only intentionally new migrations were applied.

- [ ] **Step 5: Run SHA-specific smoke/runtime checks**
Verify critical Hocker One routes, authentication, promoted Work Session behavior where applicable, and recent runtime error logs.

- [ ] **Step 6: Update continuity evidence**
Record exact SHAs, PRs, deployment IDs, migration state, validation results, and remaining manual/provider gates without secrets.

