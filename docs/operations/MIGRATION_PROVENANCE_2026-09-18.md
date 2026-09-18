# Migration Provenance Register — 2026-09-18

## Runtime authority

Production Supabase project: `yvuibbcuntqpyqiuqggd`.

Current production ledger tail:
- `20260830151252 security_definer_rpc_hardening`
- `20260830153247 revoke_dead_public_agi_catalog_view_grants`
- `20260901063237 operational_event_fabric`
- `20260902225257 rollback_operational_event_fabric`
- `20260903182025 align_queue_orphan_view_with_reconciler`

Production DDL was **not** executed during this reconciliation.

## Recoverable migrations

| Production version | Production name | Repository filename | Source commit / blob | Result |
|---|---|---|---|---|
| 20260830151252 | security_definer_rpc_hardening | `20260830151252_security_definer_rpc_hardening.sql` | `b369d1cc287ae3904bdc8a10675e04c67ec2d648` / `c8b219b0b2952c9781b03a6e2a4fbf566a473792` | Exact SQL recovered; filename normalized to production version |
| 20260901063237 | operational_event_fabric | `20260901063237_operational_event_fabric.sql` | `652a42f8d3a556d69a8e3be9d2815bd5ec6944c8` / `fcd9f6ecae8652b8e01b8c4366cabfd988164876` | Exact SQL recovered; filename normalized to production version |
| 20260903182025 | align_queue_orphan_view_with_reconciler | `20260903182025_align_queue_orphan_view_with_reconciler.sql` | `bbcadad7e3f31b74c4eb69c85506b548ca4920cb` / `aa5212d42911de6b4f87ab03907e6a891e0860bf` | Exact SQL recovered; filename normalized to production version |

## Unresolved production history

| Production version | Production name | Current evidence | Status |
|---|---|---|---|
| 20260830153247 | revoke_dead_public_agi_catalog_view_grants | Production ledger + current catalog grants show the intended effective state; no authoritative original SQL artifact located in accessible Hocker One Git history | **UNRESOLVED — do not reconstruct** |
| 20260902225257 | rollback_operational_event_fabric | PR #324 documents the pre-merge production rollback; current production has no operational event fabric objects/publication entry; original rollback SQL not located | **UNRESOLVED — do not reconstruct** |

Effective database state cannot prove the historical migration text. These two records are therefore quarantined as externally applied historical changes until an authoritative source artifact is recovered.

## Reproducibility policy

The repository test suite treats the verified/recoverable production migrations as required repository provenance.

The two unresolved versions are tracked separately and must remain absent from guessed/reconstructed repository SQL. A future authoritative artifact must be tied to its production version before the strict all-ledger contract is expanded.

## Operational rule

Never run a historical production migration again merely to repair repository provenance. Repository reconciliation is metadata/source recovery; production re-execution would create a duplicate schema change risk.
