# Migration Provenance Register — 2026-09-16

## Authority
Live Supabase production migration ledger for project `yvuibbcuntqpyqiuqggd` is the runtime authority. Repository `main` and source PR/commit history are the provenance authority for recoverable SQL. Evidence gaps are not filled by inference.

Production is currently `ACTIVE_HEALTHY` and the migration ledger currently ends at `20260903182025_align_queue_orphan_view_with_reconciler`.

## Reconciliation status

| Production version | Production name | Repository status | Provenance evidence | Action |
|---|---|---|---|---|
| `20260817021859` | `project_members_owner_admin_write_hardening_20260816` | Present on clean `main` | Existing migration file on clean `main` | Keep; no change |
| `20260817052915` | `agi_canonical_fk_indexes_20260817` | Present on clean `main` | Existing migration file on clean `main` | Keep; no change |
| `20260830151252` | `security_definer_rpc_hardening` | Restored under exact production version | PR #311 / commit history; source SQL blob `c8b219b0b2952c9781b03a6e2a4fbf566a473792` | Reconcile filename only; do not reapply |
| `20260830153247` | `revoke_dead_public_agi_catalog_view_grants` | Missing | Exact SQL source not recovered after GitHub branch/PR/commit searches; production evidence shows `agis_public_catalog` exists and `anon`/`authenticated` do not have SELECT while `service_role` does | **BLOCKED — do not invent SQL** |
| `20260901063237` | `operational_event_fabric` | Restored under exact production version | Historical branch `feat/nova-operational-realtime-20260901-v2`; exact source blob `fcd9f6ecae8652b8e01b8c4366cabfd988164876` | Reconcile filename/content only; do not reapply |
| `20260902225257` | `rollback_operational_event_fabric` | Missing | PR #324 explicitly documents the rollback and current production schema confirms the operational event table/publication are absent; exact rollback SQL source not recovered | **BLOCKED — do not reconstruct** |
| `20260903182025` | `align_queue_orphan_view_with_reconciler` | Restored under exact production version | PR #325 merge commit `e8dc1d9d44d39996e98fe4260f09bc0425c5532c`; exact source blob `aa5212d42911de6b4f87ab03907e6a891e0860bf` from original `20260904120000_...` filename | Reconcile filename only; do not reapply |

## Exact recoveries

### 20260830151252
The original repository source was named `20260830030000_security_definer_rpc_hardening.sql`, while production records the applied version as `20260830151252`. The file content is byte-identical to the recovered source blob. The repository action is therefore a provenance/filename reconciliation, not a new database change.

### 20260901063237
The exact historical SQL was recovered from the realtime feature branch. The restored production-version filename has the same Git blob SHA as the historical source, proving content identity.

### 20260903182025
PR #325 introduced the exact SQL under the temporary source filename `20260904120000_align_queue_orphan_view_with_reconciler.sql`. The production ledger records the applied version as `20260903182025`. The restored file keeps the exact SQL and changes only the migration filename/version prefix.

## Blocked provenance gaps

### 20260830153247
No trustworthy historical SQL source has been found. Current production privileges on `public.agis_public_catalog` are consistent with the migration name, but effective state is not sufficient evidence to reconstruct the exact migration text. The repository must not guess whether the original migration used `REVOKE SELECT`, `REVOKE ALL`, role-qualified grants, or other statements.

### 20260902225257
PR #324 states that the experimental realtime migration from PR #321 was applied to production before merge and then rolled back, leaving no realtime event fabric in production. Production confirms `public.hocker_operational_events` is absent and is not published through `supabase_realtime`. That proves current state and intent, but not the exact historical rollback SQL. The rollback migration must remain unresolved until its original SQL is recovered from a source commit or authoritative archived artifact.

## Safety decision

This branch intentionally does **not** modify production. It also does not weaken the migration ledger test to hide the two unresolved versions. Once the exact SQL for both blocked versions is recovered, the strict ledger contract can require all production versions to exist exactly once in Git without replaying any already-applied migration.
