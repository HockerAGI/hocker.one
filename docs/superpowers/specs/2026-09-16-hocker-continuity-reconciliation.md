# HOCKER Continuity Reconciliation Specification — 2026-09-16

## Goal
Restore reproducible repository truth against the live Supabase migration ledger, rebuild the Work Session slice on the current `main`, and reconcile the dependency queue without modifying production until all gates are green.

## Source of authority
1. Live production Supabase state, configuration, logs, and evidence.
2. GitHub `main`, migration files, workflows, and release artifacts.
3. Approved ADRs/contracts/runbooks and the project canon.
4. Canonical DOC-00..DOC-11 documents.
5. Historical documents and previous session notes.

## Guardrails
- Never reset, force-push, or directly modify `main`.
- Never apply a migration to production merely to repair repository drift when the migration is already recorded as applied remotely.
- Recover migration SQL from its original PR/commit provenance; do not recreate SQL from memory or inferred behavior.
- Feature work is isolated in branches and merged only after exact-head CI and preview validation are green.
- A CI contract must detect the exact production migration versions present in the canonical Supabase ledger; stale snapshots must be updated from live evidence rather than deleting missing versions from tests.
- Work Session uses existing project/membership/operator/owner primitives and existing AGI/action records; it must not create parallel queues or memory stores.
- Production promotion is a single gated operation after repository and runtime verification; post-deploy verification must use the promoted SHA.

## Workstreams

### A. Migration provenance
Reconcile the exact production versions currently ahead of the repository: `20260830151252`, `20260830153247`, `20260901063237`, `20260902225257`, and `20260903182025`. For each version, establish the original repository filename/content, the commit/PR that introduced it, and whether the current `main` contains an equivalent migration under another name. Record no new database DDL for already-applied versions.

### B. Work Session
Rebuild PR #371 from the latest `main` rather than merging its stale base. Preserve only the governed work-session envelope, append-only events, project/membership RLS, optimistic versioning, idempotency, and references to existing runs/tasks/action queue. Audit caller identity binding, search_path, foreign-key coverage, and event ordering before implementation changes.

### C. Dependency queue
Reconcile open Hocker One updates against the post-reconciliation `main`: Next 16.3.4 stack, Capacitor 8.5.2 stack, PostCSS 8.5.28, `@types/node` 26.4.1, Supabase JS 2.116.0, and setup-java 6.0.1. Retarget/recreate stale Dependabot branches instead of preserving patches that were based on an obsolete SHA.

### D. NOVA #50
Inspect actual `pdfkit` imports/build/runtime usage and the current dependency guard before changing the CI contract. Only move from 0.19.1 to 0.20.2 if ESM/build/runtime validation demonstrates compatibility.

## Promotion gate
No production migration, Vercel production promotion, or branch mutation of `main` is authorized until the relevant PR's exact head has green required checks, preview is associated with that exact SHA, Supabase schema validation succeeds in an isolated validation environment, and the post-change evidence bundle is recorded.
