# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-09-03 21:23 UTC-07:00**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live operational source: `docs/operations/HANDOFF_2026-09-03.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources dated 2026-08-19 remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `537493907dbd599709e20bd2f81f29e1a220b74b`.
- Vercel production: `dpl_BGFxWajgGqX3mYR1ZCzEu9cvWsH7` — READY — `hockerone.vercel.app`.
- Hocker One health: `/api/health/ping` = HTTP 200 / online.
- Core AGI certification: `2026.08.21-8` + `score-v5`, **16/16 AGIs, 48/48 PASS**.
- Tool certification: **19/19 read-only PASS**; no external writes during certification.
- All 16 AGIs remain `allow_actions=false`.
- `nova.agi/main`: `5575e671c2931a5bf6304a968aae0490d67ca9c5`.
- `hocker-node-agent/main`: `a4af22a97dc639389a4ba5f3dc8926ec95fa84ff`.
- Supabase project: `yvuibbcuntqpyqiuqggd`, PostgreSQL 17, `us-west-1`.
- Supabase migration head: current ledger includes `20260903182025_align_queue_orphan_view_with_reconciler`; re-query the migration ledger before mutation.
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

## Expansion status

**EXPANSION_READY = YES.** The baseline is suitable for adding new projects/integrations without reopening the core architecture.

**PRODUCTION_READY = NOT YET CLOSED.** Remaining items are hardening/acceptance evidence, not permission to rebuild Hocker One.

## Recovery rule

Before any material action, re-query GitHub, Vercel, Supabase and the relevant provider. The active handoff is authoritative for current narrative; this card is intentionally compact and not a substitute for live state.
