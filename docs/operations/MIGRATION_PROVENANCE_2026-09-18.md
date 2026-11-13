# Migration Provenance Register — 2026-09-18

## Runtime authority

Production Supabase project: `yvuibbcuntqpyqiuqggd`.

Current production ledger tail:
- `20260830151252 security_definer_rpc_hardening`
- `20260830153247 revoke_dead_public_agi_catalog_view_grants`
- `20260901063237 operational_event_fabric`
- `20260902225257 rollback_operational_event_fabric`
- `20260903182025 align_queue_orphan_view_with_reconciler`
- `20260918081119 20260913170000_hocker_operating_loop_work_sessions`

Production DDL was **not** executed during this reconciliation.

## Recoverable migrations

| Production version | Production name | Repository filename | Source commit / blob | Result |
|---|---|---|---|---|
| 20260830151252 | security_definer_rpc_hardening | `20260830151252_security_definer_rpc_hardening.sql` | `b369d1cc287ae3904bdc8a10675e04c67ec2d648` / `c8b219b0b2952c9781b03a6e2a4fbf566a473792` | Exact SQL recovered; filename normalized to production version |
| 20260901063237 | operational_event_fabric | `20260901063237_operational_event_fabric.sql` | `652a42f8d3a556d69a8e3be9d2815bd5ec6944c8` / `fcd9f6ecae8652b8e01b8c4366cabfd988164876` | Exact SQL recovered; filename normalized to production version |
| 20260903182025 | align_queue_orphan_view_with_reconciler | `20260903182025_align_queue_orphan_view_with_reconciler.sql` | `bbcadad7e3f31b74c4eb69c85506b548ca4920cb` / `aa5212d42911de6b4f87ab03907e6a891e0860bf` | Exact SQL recovered; filename normalized to production version |

| 20260918081119 | 20260913170000_hocker_operating_loop_work_sessions | `20260918081119_20260913170000_hocker_operating_loop_work_sessions.sql` | `8e1f78ae70cde0835e485b08101ace57d6448604` + production apply `success` | Work Session SQL validated on staging and applied once to production; effective ledger version normalized to the production-generated timestamp |

## Recovered original production statements — 2026-11-12

The previously unavailable text for the following two versions has been recovered **from production's authoritative** `supabase_migrations.schema_migrations.statements[1]`. The recovered strings were copied verbatim into the corresponding repository SQL files (no commentary or trailing newline inside the SQL source); their MD5 fingerprints match the production ledger:

| Version | Migration | Production `md5(statements[1])` | Source |
|---|---|---|---|
| 20260830153247 | `revoke_dead_public_agi_catalog_view_grants` | `239eb9922cc9d7c9be1934de8ffc06a9` | Production migration ledger |
| 20260902225257 | `rollback_operational_event_fabric` | `eb6f12fe9c6b8be8065994e12646b007` | Production migration ledger |

These are **source recovery updates**, not new migrations, and **were not executed on production** during recovery. The existing version IDs and filenames are unchanged. The migration-ledger regression test now checks exact source fingerprints for both recovered entries.

The production database currently reports **109 distinct applied versions**, and GitHub `supabase/migrations/` contains **109 version-matched SQL files**, with no missing or duplicated versions as of this audit. Version parity and recovered source fingerprints are verified; clean-room migration replay and tenant authorization testing remain **separate, unfinished gates** (#212 / #183). The legacy validation project was restored as a candidate isolated environment, but is not deemed validated until it becomes healthy and the required tests pass.

## Reproducibility policy

An applied version in the ledger cannot be re-applied to production merely because its source was recovered. Reproduce migrations only in a separate validation database with the necessary schemas, roles, prerequisites and compensating rollback plan. **Do not assert full reproducibility from version parity and two hashes alone.** Add future migration changes as new, immutable versioned files, never by editing already executed production DDL.

## Operational rule

Never run a historical production migration again merely to repair repository provenance. Repository reconciliation is metadata/source recovery; production re-execution would create a duplicate schema change risk.
