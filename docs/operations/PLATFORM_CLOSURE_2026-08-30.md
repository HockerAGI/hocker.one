# HOCKER ONE — Platform closure gate — 2026-08-30

Status: **ACTIVE — POST-CORE-CERTIFICATION / PRODUCTION-READINESS**

## Certified scope already complete

- Core AGI certification: **16/16 AGIs**
- Runtime evaluation: **48/48 PASS**
- Suite: `2026.08.21-8`
- Scoring: `score-v5`
- Tool evaluation: `2026.08.14-1`, read-only, PASS
- External writes during certification: **0**
- `allow_actions=true`: **0/16**

## Gate status

| Gate | Status | Exit evidence |
| --- | --- | --- |
| Core AGI scope | CLOSED | Supabase durable evidence + #303 completed |
| Agentic Security | OPEN | action boundary, Owner Gate, injection/tool/memory tests and containment |
| Supabase authorization/security | OPEN | Advisor classification + grant/RLS/RPC evidence |
| Owner AAL2 / Context Bridge | OPEN | controlled AAL1/AAL2 negative path + Context Bridge AAL2 activation |
| NOVA runtime/fallback | OPEN | exact deployment/revision + readiness + E2E + fallback + telemetry + rollback |
| Observability/SLO/FinOps | OPEN | logs/alerts/cost/quotas and provider reliability evidence |
| Backup/restore/continuity | OPEN | restore drill, RPO/RTO and recovery evidence |
| Release/dependency maintenance | DEFERRED | resume only after above gates or after explicit risk review |

## Supabase current findings — 2026-08-30

Security Advisor currently reports:
- 4 anonymous GraphQL/public exposure warnings: `agis_public_catalog`, `cashback_tiers`, `free_round_tiers`, `promo_offers`;
- authenticated GraphQL discoverability warnings across operational/financial/audit/observability relations;
- 2 anonymous `SECURITY DEFINER` RPC warnings: `get_public_leaderboard`, `get_public_recent_wins`;
- 4 authenticated `SECURITY DEFINER` RPC warnings including `get_my_crash_history`, `get_my_slot_history` and the public projections;
- leaked-password protection disabled.

These warnings are not equivalent to confirmed unauthorized data access. Direct production inspection confirmed RLS is enabled on the enumerated authenticated relations and found policies on them. Public catalog/tier/offer surfaces are documented as intentional public contracts. Remaining review must verify those contracts and minimize grants/outputs where possible.

A direct function inspection found that both own-history RPCs currently return game-fairness seed fields. Before changing them, inspect consumers; remove sensitive fields only if no approved client/verification contract requires them.

## Change-control rule

No production DDL, grant, RLS, view, RPC, or Auth posture change is accepted without:
1. isolated Supabase validation;
2. authorization matrix tests (anon/authenticated/owner/service);
3. Security Advisor before/after;
4. rollback/compensation plan;
5. exact production SHA/deployment evidence;
6. targeted application smoke.

## Runtime rule

Provider outage, malformed model output and partial failure are evaluated as reliability conditions when the evidence is temporary; deterministic policy/security failure remains blocking. No retry may create a duplicate material action.

## Release rule

Dependency maintenance is separated by risk domain. Security updates remain enabled; version updates may be grouped by ecosystem. Next, Capacitor, Supabase SSR/Auth, Gradle, ESLint major and PDFKit are not bundled into one release.

## Definition of Ready-to-close

No P0/P1 residual risk without owner/date/acceptance; Agentic Security tests green; Supabase authz/advisors reconciled; Owner AAL2/Context Bridge evidence complete; NOVA fallback/recovery proven; backup restore measured; observability/FinOps operational; exact release/rollback/continuity evidence synchronized.
