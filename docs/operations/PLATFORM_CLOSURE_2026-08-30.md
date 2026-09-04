# HOCKER ONE — Platform closure gate — 2026-08-30

Status: **ACTIVE — EXPANSION_READY / PRODUCTION-READINESS HARDENING**

## Current verified baseline

- Hocker One `main`: `537493907dbd599709e20bd2f81f29e1a220b74b`.
- Vercel production: `dpl_BGFxWajgGqX3mYR1ZCzEu9cvWsH7` — READY.
- `/api/health/ping`: HTTP 200 / online.
- Core AGI certification: **16/16 AGIs, 48/48 PASS**, `2026.08.21-8` + `score-v5`.
- Tool certification: **19/19 read-only PASS**; `external_writes_executed=false`.
- `allow_actions=true`: **0/16**.
- `nova.agi/main`: `5575e671c2931a5bf6304a968aae0490d67ca9c5`.
- `hocker-node-agent/main`: `a4af22a97dc639389a4ba5f3dc8926ec95fa84ff`.
- Supabase migration ledger includes `20260903182025_align_queue_orphan_view_with_reconciler`; current head must be re-queried before mutation.

## Gate status — audited against the master execution plan

| Phase / gate | Status | Evidence / remaining work |
| --- | --- | --- |
| Phase 0 — baseline/state | **CLOSED** | Current SHA/deployment/DB/NOVA/node state reconciled in active handoff. |
| Phase 1 — AGI Core certification | **CLOSED** | 16/16, 48/48 PASS under current suite/scorer; tool evaluation 19/19 PASS; 0 external writes. |
| Phase 1 — dedicated agentic-security pack | **OPEN** | Full fresh pack for prompt injection, memory poisoning, tool injection, privilege escalation, cross-tenant, forged approval, malicious MCP, secret exfiltration and cascading delegation is not yet evidenced as a single closed artifact. |
| Phase 2 — NOVA Runtime/Capability Fabric | **OPEN** | Hocker One runtime is healthy, but `nova.agi` dedicated Railway runtime still requires exact-revision/readiness/E2E/fallback/telemetry/rollback evidence. |
| Phase 3 — NOVA Workspace 2.0 | **OPEN** | `NovaRealtimeChat` remains a large monolithic client; the requested component decomposition and full capability surface are not on current `main`. |
| Phase 4 — Hocker One UX simplification | **PARTIAL** | Core routes/components exist, but current-state audit does not prove the complete five-question Home/navigation/integrations/VFX target. |
| Phase 5 — OperationalState / Observability / FinOps | **OPEN** | DB has `v_agi_operational_state`, but the full frontend OperationalState contract, SLO/alert/cost evidence and complete decision-oriented charts are not proven complete. |
| Phase 6 — Responsive / Accessibility / Device certification | **OPEN** | No current exact-main evidence pack for the complete WCAG/responsive/device matrix. |
| Phase 7 — Recovery / SRE | **OPEN** | Backup/restore, RPO/RTO and provider/DB/NOVA failure drills are not fully evidenced. |
| Phase 8 — Final RC | **OPEN** | No final RC artifact covering all applicable gates on one frozen SHA. |
| Phase 9 — Final production/canon closure | **OPEN** | Production is healthy, but not all closure gates above have evidence. |
| Dependency maintenance | **PARTIAL / DEFERRED WHERE APPROPRIATE** | Supabase JS, Lucide, Gradle and Capacitor are already integrated. Remaining #290/#301/#296 should stay isolated and non-blocking unless they address current risk. |

## Supabase security — current findings

Security Advisor currently reports:
- anonymous GraphQL exposure: `cashback_tiers`, `free_round_tiers`, `promo_offers`;
- authenticated GraphQL discoverability across operational/financial/audit/observability relations;
- public `SECURITY DEFINER` execution for `get_public_leaderboard` and `get_public_recent_wins`;
- leaked-password protection disabled.

The previous `search_path` hardening findings are no longer present. `agis_public_catalog` unnecessary exposure was removed.

Remaining Advisor warnings require contract review rather than blanket revocation. Existing RLS policies and real Hocker One consumers must be preserved unless replacement paths are proven.

## External/human gates

- `hocker.one #166`: real Owner AAL1/AAL2 negative-path + containment smoke.
- `hocker.one #167`: Context Bridge AAL2 activation and retirement of legacy activation path only after proof.
- `hocker.one #200`: Leaked Password Protection remains provider-plan blocked on Supabase Free; keep classified as external blocker rather than engineering failure.
- `hocker.one #203`: Android API 36 manual run completed successfully in the current continuation cycle.
- `hocker.one #210`: Cloudflare provider-side MCP/Worker hardening evidence.
- `nova.agi #31`: Railway deployment/readiness/fallback/recovery evidence.
- `hocker.one #212`: isolated Supabase branch cannot be created on the current Hobby project; no fake branch/evidence.

User has confirmed credential rotation is complete; #181 is not being treated as an active engineering blocker unless new evidence contradicts that assertion.

## Source-branch rescue

Historical UX/MCP/NOVA branches may contain useful work, but they are not current truth. Relevant work must be selectively ported after diff review, current-main rebase, dependency review and exact-head verification. Do not merge large historical branches wholesale.

## Closure rule

The platform may be labelled **EXPANSION_READY** for development of new projects/integrations.

It may be labelled **PRODUCTION_READY / FINAL** only when all applicable rows in this gate table have traceable evidence and the final release/continuity artifact is synchronized with the deployed SHA.
