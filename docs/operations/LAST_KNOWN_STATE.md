# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-08-30 03:00 UTC**
Scope: Hocker One + NOVA + canonical AGI Core.

Live operational source: `docs/operations/HANDOFF_2026-08-30.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources dated 2026-08-19 remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `4b53c0d25cc74c6dbd0a4f030fde1768550b6977` at the start of post-certification hardening.
- Core AGI certification: `2026.08.21-8` + `score-v5`, 16/16 AGIs, 48/48 PASS, 19 read-only tool evaluations PASS, 0 external writes.
- `#303`: CLOSED / COMPLETED.
- `#306`: OPEN / P0 production-readiness master gate.
- All 16 AGIs remain `allow_actions=false`.
- Owner TOTP and real AAL2 evidence are present.
- Supabase project `yvuibbcuntqpyqiuqggd` is active/healthy in `us-west-1`, PostgreSQL 17.

## Current Supabase security posture

Security Advisor remains OPEN with contract-review findings:
- anonymous public GraphQL surfaces: `agis_public_catalog`, `cashback_tiers`, `free_round_tiers`, `promo_offers`;
- authenticated GraphQL discoverability warnings across operational/audit/financial/observability relations;
- SECURITY DEFINER RPC execution warnings for public projections and own-history functions;
- leaked-password protection disabled.

Direct inspection on 2026-08-30 confirmed RLS enabled and policies present on the enumerated authenticated relations. Public surfaces have documented intent. No grants or policies were changed during this inspection.

Direct function inspection also found own-history RPCs returning seed fields; this is a hardening review item, not yet a production mutation.

## Current engineering posture

- No production DDL/grants/RLS changes have been applied during this post-certification audit.
- Dependency maintenance remains deferred until the security/runtime gates are stable.
- Performance `unused_index` findings remain INFO and are not deletion instructions.
- Historical evidence is preserved.

## Next exact move

1. Confirm the cost of a disposable Supabase validation branch before creating it; the current quoted cost is US$0.01344/hour.
2. On the disposable branch, reproduce current grants/RLS/functions and run authorization regression tests.
3. Validate minimal safe hardening for SECURITY DEFINER outputs/ACLs and any non-contract GraphQL grants.
4. Re-run Security Advisor and application smoke before any production promotion.
5. Execute the remaining Owner AAL1/AAL2 and Context Bridge gates from #166/#167.
6. Validate NOVA fallback/recovery and Tier 0/1 restore evidence.
7. Resume deferred dependency/mobile maintenance one isolated candidate at a time.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role certification bypass, broad policy/grant additions, production DDL before isolated validation, secret values in evidence, destructive history cleanup, or unverified external-runtime claims.
