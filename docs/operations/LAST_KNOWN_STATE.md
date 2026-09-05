# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-09-05 01:37 UTC-07:00**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live operational source: `docs/operations/HANDOFF_2026-09-04.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources dated 2026-08-19 remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `b1b8554fd7f9c7091634df6487687472a1d0e127` (History workspace merged and promoted; re-query before mutation).
- Vercel production pointer: re-query before mutation; historical deployment IDs are not live evidence.
- Hocker One health: public smoke `/chat` = HTTP 200; authenticated private APIs return HTTP 401 without identity; production runtime errors observed in post-merge window = 0.
- Core AGI certification baseline: `2026.08.21-8` + `score-v5`, **16/16 AGIs, 48/48 PASS**; this remains a durable baseline, not fresh liveness evidence.
- Tool certification: **19/19 read-only PASS**; no external writes during certification.
- All 16 AGIs remain `allow_actions=false`.
- `nova.agi/main`: `2e3d2f8c8c577b88678267fd02b96c37afa1f567`.
- `hocker-node-agent/main`: `3fd8b8adaf6ad4bae66c432536bd955552f0f0f6`.
- Supabase project: `yvuibbcuntqpyqiuqggd`, PostgreSQL 17, `us-west-1`.
- Supabase migration head: `20260903182025_align_queue_orphan_view_with_reconciler`; re-query the migration ledger before mutation.
- Canon completeness view: `12.6C.1B`, 16 registry profiles, 16 runtime agents, 16 canonical memories, 16 specialized feeds, 34 enabled tool assignments.

## Recent completed maintenance

- Supabase JS #294: merged and post-merge production smoke passed.
- Lucide #293: merged and post-merge production smoke passed.
- Gradle #285: merged as patch `9.7.1`.
- Capacitor #300: merged with Core/Android/CLI aligned at `8.5.0`.
- #287: closed as completed after coordinated Capacitor stack integration.
- #312: closed as duplicate of the canonical Android gate #203.

## Supabase security posture

Resolved in production:
- reviewed RPC `search_path` hardening;
- own-history RPCs moved to `SECURITY INVOKER`;
- explicit grants retained;
- `agis_public_catalog` unnecessary anon/authenticated GraphQL exposure removed.

Still open and requiring contract-based review:
- public GraphQL: `cashback_tiers`, `free_round_tiers`, `promo_offers`;
- authenticated GraphQL discoverability across operational/financial/audit/observability relations;
- public `SECURITY DEFINER` execution for `get_public_leaderboard` and `get_public_recent_wins`;
- `auth_leaked_password_protection` remains disabled.

These findings do not by themselves prove cross-tenant leakage. Do not perform broad REVOKE/policy changes without consumer evidence, authorization tests, rollback and Advisor recheck.

## Master-plan implementation audit

### Complete at current baseline
- Canonical NOVA History workspace: owner/project-scoped history API, persisted history panel and `thread_id` restoration on `/chat` (PR #335; production SHA `b1b8554fd7f9c7091634df6487687472a1d0e127`).
- Core AGI certification scope.
- Primary AGI action boundary: `allow_actions=false` baseline.
- Initial Supabase function hardening.
- Hocker One production dependency maintenance for Supabase JS, Lucide, Gradle and coordinated Capacitor.
- Stable Hocker-node-agent baseline and patch maintenance.
- Active operations index/handoff/closure structure exists.

### Still incomplete or not fully evidenced
- `NovaWorkspace` decomposition is not implemented on `main`; `NovaRealtimeChat` remains monolithic.
- Full chat capability surface (real file upload, voice, artifact viewer, connector/tool UX) is not certified complete on `main`.
- Full frontend `OperationalState` contract is not implemented as specified; DB `v_agi_operational_state` is narrower.
- Full responsive/accessibility/device certification matrix is not evidenced as complete.
- Full backup/restore and measured RPO/RTO drill is not evidenced.
- Full dedicated agentic-security eval pack and complete current evidence pack are not yet closed.
- Owner AAL1/AAL2 negative-path + containment remains an external human gate.
- Context Bridge AAL2 migration remains open.
- NOVA dedicated Railway runtime remains unverified.
- Android API 36 was manually executed successfully during the current continuation cycle; re-run only if the Android build/contract changes.
- Supabase Leaked Password Protection remains a manual Dashboard gate and is blocked by the current Free plan.

## Current operational freshness

- `agi_agents = 16`.
- `allow_actions=true = 0`.
- `agi_runs` in last 24h = **0**; latest recorded run = `2026-08-30T02:48:30Z`.
- `agi_integration_checks` in last 24h = **0**; latest recorded check = `2026-08-10T06:17:05Z`.
- `nodes` seen in last 24h = **0**; latest recorded node signal = `2026-08-18T09:52:48Z`.
- Therefore registry presence is verified, but fresh AGI execution/node liveness is not.

## Expansion status

**EXPANSION_READY = YES.** The baseline is suitable for adding new projects/integrations without reopening the core architecture.

**PRODUCTION_READY = NOT YET CLOSED.** Remaining items are hardening/acceptance evidence, not permission to rebuild Hocker One.

## Recovery rule

Before any material action, re-query GitHub, Vercel, Supabase and the relevant provider. The active handoff is authoritative for current narrative; this card is intentionally compact and not a substitute for live state.

Latest History gate evidence: PR #335 was validated on exact HEAD via Vercel Preview `READY`; production deployment `dpl_Az6NQE4A2aK2UxbmqBz92yBEviHd` is `READY` on the same merge SHA. Public smoke: `/chat` HTTP 200; unauthenticated private history/runtime endpoints HTTP 401. No production runtime errors observed in the post-merge check.
