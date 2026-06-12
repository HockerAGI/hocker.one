# Supabase Remote vs Local Baseline Report - Hocker ONE

Date: 2026-05-09
Branch: ops/supabase-baseline-adoption-20260509_041537
Remote project ref: yvuibbcuntqpyqiuqggd

## Executive conclusion

The remote Supabase database already contains a real operational schema, real policies, functions, data estimates and production-like Chido/Hocker objects.

The local migration folder does not fully represent the current remote database. Therefore, normal Supabase CLI migration adoption is not authorized yet.

## Remote manifest summary

- Migration history: MISSING
- Public tables: 50
- Public columns: 475
- Constraints: 95
- Indexes: 123
- Policies: 117
- Functions: 36
- Triggers: 14

## Local migration summary

Local migrations present:

- 20260216_0000_core.sql
- 20260216_0001_supply.sql
- 20260226_0002_alignment.sql
- 20260419_0003_nova_alignment.sql
- 20260421_0004_runtime_guardrails.sql
- 20260428_0005_hocker_one_project_alignment.sql
- 20260502_0003_hocker_core_hardening.sql
- 20260506_hocker_tenant_rls_foundation.sql

These migrations cover important Hocker ONE structures, but not the complete remote Chido Casino operational schema.

## Hotfixes already applied manually

### Remote table security hotfix

- agent_logs RLS enabled.
- supply_order_items RLS enabled.
- anon/authenticated table privileges revoked.
- service_role retained.

Recorded at:

- supabase/manual-patches/20260508_remote_security_hotfix.sql

### RPC execute hardening hotfix

Direct anon/authenticated execution revoked from:

- _distribute_affiliate_commission
- crash_play_round
- place_bet
- profiles_add_free_spins
- request_withdrawal

service_role execution preserved.

Recorded at:

- supabase/manual-patches/20260509_rpc_execute_hardening_hotfix.sql

## Current authorization status

Allowed:

- Read-only audits.
- Documentation commits.
- Manual hotfix recording.
- Production validation.

Not allowed yet:

- npx supabase db push --linked
- npx supabase migration repair
- npx supabase db reset
- Any destructive schema migration

## Recommended path

1. Keep remote production database as source of truth.
2. Export or reconstruct a baseline SQL from the current remote schema.
3. Archive old partial local migrations or mark them as historical only.
4. Create a new baseline migration that matches the remote state.
5. Only after parity is confirmed, adopt Supabase CLI migration tracking.
