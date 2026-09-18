# Migration Provenance Register — 2026-09-17

## Authority and scope

Production authority is the Supabase project `yvuibbcuntqpyqiuqggd`. The live migration ledger currently ends at `20260903182025`.

This register distinguishes:
- **proven**: repository SQL and original PR/commit provenance are recoverable;
- **equivalent-but-unversioned**: repository contains SQL that appears to correspond to the live migration, but the exact production version mapping is only proven by historical reconciliation evidence;
- **unresolved**: production records the version/name, but the originating SQL is not present in the currently accessible Git history/PR provenance.

No production DDL is executed by this reconciliation.

## Current live tail

| Production version | Production name | Repository state | Provenance |
|---|---|---|---|
| 20260817052915 | agi_canonical_fk_indexes_20260817 | present with exact version | proven |
| 20260830151252 | security_definer_rpc_hardening | repository has `20260830030000_security_definer_rpc_hardening.sql` | proven SQL; version rename was proposed in #311 but #311 was closed without merging |
| 20260830153247 | revoke_dead_public_agi_catalog_view_grants | no matching migration filename on current main | unresolved |
| 20260901063237 | operational_event_fabric | no matching migration filename on current main | unresolved |
| 20260902225257 | rollback_operational_event_fabric | no matching migration filename on current main | unresolved |
| 20260903182025 | align_queue_orphan_view_with_reconciler | repository has `20260904120000_align_queue_orphan_view_with_reconciler.sql` | proven SQL from #325; filename/version drift remains |

## Proven evidence

### 20260830151252

PR #310 merged the exact SQL as `20260830030000_security_definer_rpc_hardening.sql`. The SQL hardens four public RPCs by setting security invoker/search_path where applicable and replacing implicit PUBLIC execute with explicit grants.

PR #311 was created specifically to align the repository filename with production version `20260830151252`, but it was closed without merge. Therefore current main cannot claim that filename reconciliation is already landed.

### 20260903182025

PR #325 introduced the orphan-view SQL as `20260904120000_align_queue_orphan_view_with_reconciler.sql`. The exact SQL is recoverable from commit `bbcadad7e3f31b74c4eb69c85506b548ca4920cb`.

The SQL defines `public.v_queue_without_run` using `q.status = 'executed'`, no matching run, no archive row, and revokes anon/authenticated privileges. Production records the same semantic migration under version `20260903182025`.

## Unresolved production-applied versions

The live Supabase ledger records the following versions/names, but the accessible Hocker One Git history and PR set for the relevant period does not expose an originating SQL patch:

- `20260830153247_revoke_dead_public_agi_catalog_view_grants`
- `20260901063237_operational_event_fabric`
- `20260902225257_rollback_operational_event_fabric`

The repository commit history from 2026-08-30 through 2026-09-04 contains the #310 RPC hardening, #325 queue-orphan fix, #326 API fix, continuity commits, and dependency changes, but no commits introducing these three migration filenames. Therefore their SQL must not be reconstructed from the current database schema or documentation and then presented as original provenance.

## Gate status

**Migration reproducibility gate: BLOCKED by three provenance gaps plus two filename/version reconciliations.**

Required next evidence for the unresolved versions:
1. originating PR/commit containing the exact SQL; or
2. an authoritative archived migration artifact/export whose integrity and production relationship can be proven.

Until that evidence exists:
- do not add guessed SQL;
- do not execute compensating/replay DDL in production;
- do not mark the repository/production migration history fully reproducible;
- keep Work Session production migration blocked.

## Safety note

The production ledger is evidence of applied migration records, not a source repository for the original SQL. Database catalog introspection can verify current state, but it cannot by itself prove the original migration text or provenance.
