# HOCKER Continuity Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reproducible repository truth against production, rebuild Work Session on the current `main`, and close only dependency PRs proven compatible with the resulting head.

**Architecture:** Separate migration provenance repair from feature work. The provenance branch contains only exact already-applied migrations plus a live-ledger regression test; the Work Session branch then starts from that reconciled head and carries only its bounded schema/store/tests. Dependency updates are independently validated against the new base. Production remains untouched until exact-head gates are green.

**Tech Stack:** GitHub pull requests/branches, Next.js/TypeScript, Supabase/PostgreSQL migrations and RLS, Node test runner, Vercel previews.

**Spec:** `docs/superpowers/specs/2026-09-16-hocker-continuity-reconciliation.md`

## Global Constraints

- Never reset, force-push, or directly modify `main`.
- Never re-apply a Supabase migration already present in the production migration ledger.
- Recover migration SQL from original PR/commit provenance; never reconstruct from memory.
- Use exact current `main` SHAs as rebase/reference points.
- Merge only after exact-head required CI and relevant preview validation are green.
- Keep Work Session isolated from new queues, memory stores, runtime routers, or duplicate AGI payloads.
- Production promotion is last and must be followed by SHA-specific smoke/runtime verification.

---

### Task 1: Establish the migration drift register from live evidence

**Files:**
- Modify: `tests/supabase-migration-ledger.test.mjs`
- Create: `docs/operations/MIGRATION_PROVENANCE_2026-09-16.md`

**Interfaces:**
- Consumes: production Supabase `supabase_migrations.schema_migrations` ledger and current `supabase/migrations/` tree.
- Produces: an exact set of remote versions and a provenance table mapping each version to a repository path/commit/PR or an explicitly unresolved evidence gap.

- [ ] **Step 1: Capture the production migration list**
Run the connected Supabase migration listing against project `yvuibbcuntqpyqiuqggd` and record the newest versions, with special attention to `20260830151252`, `20260830153247`, `20260901063237`, `20260902225257`, and `20260903182025`.

- [ ] **Step 2: Enumerate repository migration filenames on the current `main`**
Use GitHub Contents API for `supabase/migrations` at commit `a85fa87a4d98135e6b92c8bbaa6c9faa8e9e3828`; compare the version prefixes against the live list.

- [ ] **Step 3: Recover exact provenance for already-applied versions**
For each missing version, search closed PRs/commits and fetch the exact patch. Known starting points are PR #311 for the `20260830151252` rename and PR #325 plus continuity records for `20260903182025`. Do not create a file until its SQL is obtained from a source commit/patch.

- [ ] **Step 4: Write the provenance register**
Record version, live-applied state, exact filename, source PR/commit, SQL recovery evidence, and whether the repository path is already equivalent under a different filename.

- [ ] **Step 5: Run a drift-only diagnostic**
Before changing the ledger test, execute the current migration ledger test against the branch baseline and preserve its failure output showing which versions are missing. The failure must be attributable to the stale snapshot, not test syntax.

- [ ] **Step 6: Commit the evidence register**
Use `git` semantics conceptually as `docs: record live migration provenance` in the isolated branch; verify the branch starts from the current `main` SHA.

---

### Task 2: Restore exact migration files for production-applied versions

**Files:**
- Create or modify only `supabase/migrations/<exact-production-version>_<recovered-name>.sql` for versions missing from the repository.
- Preserve existing files whose version/content already matches production.

**Interfaces:**
- Consumes: Task 1 provenance register and original PR/commit patches.
- Produces: one canonical repository migration filename per applied production version, with no production DDL execution.

- [ ] **Step 1: Recover each missing SQL patch before writing**
For every unresolved version, locate the originating PR/commit. If GitHub lexical search is insufficient, inspect the dated commit range and fetch individual commit/PR patches until the exact SQL is found. Stop on any version whose SQL cannot be proven.

- [ ] **Step 2: Add only the recovered SQL**
Create the missing migration file using the exact recovered SQL. Do not alter SQL semantics or normalize it from memory.

- [ ] **Step 3: Reconcile known renamed migrations**
For `20260830151252`, preserve the hardening SQL from PR #311 under the exact production version name. For `20260903182025`, use the exact orphan-view SQL recorded by the source PR/continuity evidence, not the stale `20260904120000` filename.

- [ ] **Step 4: Run the migration ledger test and inspect duplicate/missing output**
Expected: the test must progress from the known missing-version failure to either PASS or a strictly smaller, evidence-backed discrepancy.

- [ ] **Step 5: Commit the migration provenance repair**
Commit only recovered migration files and the provenance register in the provenance branch.

---

### Task 3: Replace the stale production-version snapshot with a reproducible live-ledger contract

**Files:**
- Modify: `tests/supabase-migration-ledger.test.mjs`
- Modify: `docs/operations/MIGRATION_PROVENANCE_2026-09-16.md`

**Interfaces:**
- Consumes: canonical production version list from Task 1.
- Produces: a regression contract that fails on missing or duplicate version prefixes without silently deleting current production history.

- [ ] **Step 1: Write the smallest failing regression for the first missing version**
Extend the test fixture with the exact missing version from the live ledger and run only this test; it must fail because the corresponding file is absent.

- [ ] **Step 2: Add all exact production versions through the current ledger tail**
Update the snapshot only from the live evidence captured in Task 1; preserve every previously verified version.

- [ ] **Step 3: Run the full migration-ledger regression**
Expected: PASS with zero duplicates and zero missing production versions.

- [ ] **Step 4: Verify no new migration execution is implied**
Inspect the diff to ensure the test and repository files only reconcile history; no migration runner or deployment hook is changed to re-run production DDL.

- [ ] **Step 5: Commit the green provenance test**
Commit with a message such as `test(db): reconcile production migration ledger provenance`.

---

### Task 4: Create a fresh Work Session branch from the reconciled main

**Files:**
- Existing PR source files are the only intended functional files: `supabase/migrations/<work-session-migration>.sql`, `lib/.../store.ts` where the current PR changed it, and the relevant Work Session regression test files.

**Interfaces:**
- Consumes: the green provenance branch head.
- Produces: a new branch containing only the validated Work Session slice, with PR #371 either retargeted if its head can be safely rebuilt or closed in favor of the clean replacement PR.

- [ ] **Step 1: Fetch PR #371 changed filenames and exact patch**
Use GitHub `list_pr_changed_filenames` and `fetch_pr_patch` so no unrelated file is carried forward.

- [ ] **Step 2: Audit the current PR SQL before copying it**
Verify `security invoker`, search_path, RLS policies, foreign-key references, idempotency behavior, `FOR UPDATE` transition locking, and event sequencing against the source patch and canonical contracts.

- [ ] **Step 3: Write a failing test for caller identity binding**
Add a focused contract proving a caller cannot create/transition a work session on behalf of another user merely by supplying a different `created_by` or actor id when the canonical authorization model requires binding to `auth.uid()`.

- [ ] **Step 4: Run the new contract against the current implementation**
Expected: FAIL if the audit confirms the input is not bound correctly.

- [ ] **Step 5: Implement the minimum authorization correction**
Change only the Work Session RPC/store contract required by the failing test; do not broaden scope.

- [ ] **Step 6: Run focused Work Session tests**
Expected: existing Work Session lifecycle, idempotency, invalid transition, concurrency, event order, FK, and project-authority tests remain green.

- [ ] **Step 7: Run repository gates**
Run the repository's typecheck, lint, unit/regression, build, and security/audit scripts used by the relevant CI workflow.

- [ ] **Step 8: Push a fresh branch and create/retarget the PR**
The PR base must be the reconciled current `main` lineage, not the stale `cc3ecb28...` base currently recorded on #371.

---

### Task 5: Reconcile dependency PRs against the new main

**Files:**
- `package.json`
- `package-lock.json`
- `.github/workflows/*` where an action update is actually used
- Tests/contract files only when a dependency release demonstrably requires an existing compatibility assertion to move.

**Interfaces:**
- Consumes: fresh reconciled `main` and current open PRs #355, #356, #357, #358, #359, #372.
- Produces: individually green PRs or explicitly closed/recreated stale Dependabot PRs.

- [ ] **Step 1: Re-audit each PR head against current main**
Check actual head SHA, changed files, package versions, lockfile, required checks, and whether the branch is based on obsolete `main`.

- [ ] **Step 2: Validate Next 16.3.4 dependency coupling**
Confirm the required `sharp` floor from the official Next release notes and compare it with the repository lockfile. Do not merge #355 with an incompatible sharp version.

- [ ] **Step 3: Validate Capacitor 8.5.2**
Run the existing web/mobile build and Capacitor-specific checks; preserve API compatibility and the existing native contract.

- [ ] **Step 4: Validate PostCSS 8.5.28**
Ensure the regression test now expresses the current dependency contract and is not merely weakened to accommodate the Dependabot change.

- [ ] **Step 5: Validate @types/node 26.4.1**
Confirm TypeScript compatibility and that the runtime remains on the repository's intended Node major. Type-only changes must not widen runtime assumptions.

- [ ] **Step 6: Validate Supabase JS 2.116.0**
Confirm current main already contains the required version where appropriate and reconcile #359 rather than duplicating an already-landed upgrade.

- [ ] **Step 7: Validate actions/setup-java 6.0.1**
Search every workflow use and run CI on the exact head. Merge only if the action is used and all workflow behavior stays valid.

- [ ] **Step 8: Close/recreate obsolete Dependabot branches instead of patching stale bases indefinitely**
Use Dependabot's recreate/rebase mechanism only after confirming the new base is authoritative.

---

### Task 6: Resolve NOVA AGI PR #50 only after usage audit

**Files:**
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- Existing PDF/document generation source files that import `pdfkit`, only if compatibility testing exposes a required code change.

**Interfaces:**
- Consumes: Nova `main=4c11aff901292dc8ef3f2933f91d4776b7b282e9` and PR #50 head.
- Produces: a green dependency upgrade or a documented keep-at-current-version result.

- [ ] **Step 1: Inspect actual pdfkit imports and runtime usage**
Search all source/test imports, document whether code relies on CommonJS/ESM behavior, virtual-fs, standard-font assumptions, browser imports, or named exports.

- [ ] **Step 2: Reproduce the existing CI failure**
Run the exact dependency-remediation contract from `.github/workflows/ci.yml`; record the failing assertion before changing it.

- [ ] **Step 3: Compare with pdfkit 0.20.2 release behavior**
Use the upstream release notes and changelog already associated with #50 to test compatibility against the actual usage found in Step 1.

- [ ] **Step 4: Write/adjust a focused compatibility regression first**
The test must fail on the incompatible behavior or pass unchanged if the code is already compatible; do not modify production code without a red test.

- [ ] **Step 5: Apply the minimum dependency/CI correction**
Only update the contract if 0.20.2 is the intended supported version and the actual usage is compatible. Otherwise leave the current floor and close/recreate the PR with evidence.

- [ ] **Step 6: Run full Nova CI-equivalent validation**
Typecheck, tests, build, dependency/security audit, and exact-head workflow checks must all be green.

---

### Task 7: Promote only after all relevant PRs are green

**Files:**
- Release/continuity documentation only; no direct `main` edits outside the approved merges.

**Interfaces:**
- Consumes: green PR heads and exact merge SHAs.
- Produces: one controlled production promotion with post-deploy evidence.

- [ ] **Step 1: Verify no open blocking PR has stale base or failing required checks**
Use exact head SHAs, not PR titles.

- [ ] **Step 2: Merge in dependency-safe order**
Merge provenance first, then Work Session, then independent dependency upgrades only when their exact-head checks remain green after each base movement.

- [ ] **Step 3: Verify production deployment SHA**
Confirm Vercel production resolves to the expected merged `main` commit before treating the release as published.

- [ ] **Step 4: Verify Supabase production schema without replaying reconciled migrations**
Confirm only intended new migrations were applied; all reconciled historical versions must already be present in the migration ledger.

- [ ] **Step 5: Run SHA-specific smoke/runtime checks**
Check authenticated access, key Work Session path if promoted, critical Hocker One health routes, and recent runtime logs.

- [ ] **Step 6: Update continuity evidence**
Record final SHAs, migrations, deployment IDs, test results, and remaining open items in the project continuity record.

---

## Self-review checklist

- [ ] Every production-applied version ahead of the repository is covered by a provenance task.
- [ ] No task says to reconstruct SQL without source evidence.
- [ ] Work Session is isolated from migration reconciliation.
- [ ] Dependency upgrades are individually testable and base-aware.
- [ ] Nova #50 is conditioned on actual code usage rather than package metadata alone.
- [ ] No production mutation occurs before green exact-head verification.
