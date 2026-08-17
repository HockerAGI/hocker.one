# HOCKER — DOC-ALIGNMENT / Estado observable — 2026-08-17

Status: **ACTIVE ALIGNMENT EVIDENCE — NOT A RELEASE AUTHORIZATION**  
Evidence cut: **2026-08-17T01:46:00Z** / 2026-08-16 America/Tijuana.  
Scope: Hocker One + NOVA + canonical AGI core, with current GitHub/Vercel/Supabase production authority and provider-documentation watch items.

Baseline rule: **production/configuration > `main`/migrations > executable contracts/tests > approved evidence > canonical publications > historical material**.

This document does not replace the 2026.08 canonical publications. It records factual drift that must be reconciled in the next approved DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 editions. Historical alignment files remain immutable evidence.

## 1. Production authority at this cut

### Hocker One GitHub

- Repository: `HockerAGI/hocker.one`.
- Current `main`: `a32a0a01c8198477d542e201889f80d21a13573f`.
- The P0 provider-independent AGI/runtime branch commit `a8b736940900dd78c79097a8bb9f4f7808c60f7c` is an ancestor of current `main`; **P0 must not be reapplied as a new candidate**.
- PR #214 is merged. Its merge commit is `945ed9cdeda909faa9823230d2a4f47ff84173c7`.
- `main` subsequently advanced through additional continuity/security/migration-ledger changes; therefore #214 is no longer the current production head.

### Exact-head verification

For current `main` `a32a0a01c8198477d542e201889f80d21a13573f`:

- GitHub Actions CI run `31985692151` / run #754: **SUCCESS**.
- GitHub CodeQL default-setup run `31985691861`: **SUCCESS**.
- Vercel status check: **SUCCESS**.

These checks establish build/test/static-analysis evidence for the exact production source head. They do not by themselves prove every authenticated product flow or external dependency end-to-end.

### Vercel production

- Project: `hocker-one` / `prj_QoUSRUZj4LQmB3qoRF3bnoFOFQPz`.
- Team: `Hocker AGI` / `team_nEtACFYtjltFLERznYyZ40pK`.
- Current production deployment: `dpl_EF3RTXT7XfxS7nGTAz8jb187PT31`.
- Deployment source SHA: `a32a0a01c8198477d542e201889f80d21a13573f`.
- Deployment state: **READY**.
- Runtime error-cluster query for the reviewed 24-hour window: **no runtime errors found**.

Absence of recorded runtime errors is only an absence-of-errors signal. It is **not** a substitute for authenticated NOVA chat E2E, mobile QA, provider fallback drills or load/latency evidence.

## 2. P0 provider-independent runtime and durable memory — current production state

The implementation previously tracked as P0 is now part of current `main` and its database migration chain is registered in the primary Supabase project.

### Production migration evidence

Primary project: `Hocker AGI Technologies` / `yvuibbcuntqpyqiuqggd`.

Observed P0/current migration versions include:

- `20260816215532` — `hocker_nova_service_only_policy_intent`;
- `20260816215830` — `unified_agi_sessions`;
- `20260816215914` — `unified_agi_session_explicit_deny_policies`;
- `20260816220010` — `unified_agi_legacy_quarantine`;
- `20260816220105` — `link_dedicated_nova_fallback`;
- `20260816220145` — `unified_agi_sessions_service_role_least_privilege`;
- `20260817003451` — `core_command_node_policy_reconciliation_20260817`;
- `20260817013714` — `backend_only_explicit_deny_policies_20260817`.

### Read-only database verification

At this cut:

- legacy `nova_threads`: **114**;
- legacy `nova_messages`: **238**;
- canonical `agi_sessions`: **116**;
- canonical `agi_messages`: **238**;
- `llm_usage`: **109**;
- legacy NOVA threads with verified `user_id`: **1**;
- canonical sessions in `pending_reconcile`: **0**;
- duplicate `(session_id, message_key)` groups: **0**.

These are inventory/invariant counts, not product-completion percentages.

### P0 access boundary

Observed for `public.agi_sessions` and `public.agi_messages`:

- RLS enabled;
- explicit deny-direct-access policies present;
- no table grants observed for `anon` or `authenticated`;
- `service_role` table privileges are limited to `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

Observed P0 RPCs `append_agi_message`, `backfill_legacy_nova_sessions`, `ensure_agi_session`, `mark_agi_legacy_sync_pending` and `sync_agi_turn_to_legacy_nova`:

- are `SECURITY DEFINER`;
- set `search_path=public`;
- are not executable by `anon` or `authenticated`;
- are executable by `service_role`.

This is currently fail-closed for direct client access. It remains subject to periodic `SECURITY DEFINER` review and does not authorize expanding EXECUTE or table grants.

## 3. NOVA architecture reconciliation

The 2026-08-05 architecture publication described the dedicated `nova.agi` Fastify runtime as the primary NOVA runtime. Current Hocker One code/production has moved materially beyond that snapshot.

Current implementation authority:

- Hocker One contains the provider-independent model router and durable global conversation store.
- Hocker One is the primary NOVA chat/runtime path.
- The dedicated `nova.agi` service is retained as compatibility/fallback architecture and must not be promoted back to a mandatory primary dependency without current deployment/health/E2E evidence.
- Provider/model identity is internal telemetry and routing state, not NOVA's public identity.
- Material tool mutations remain governed by Hocker One Owner Gate; the runtime does not gain autonomous production writes because inference routing changed.

This changes DOC-05/DOC-06 factual architecture and must be incorporated into the next formal canonical edition. The canonical policy that model/provider changes require regression evidence remains valid.

## 4. Current Supabase security posture

P0 tables/RPCs are not the current source of Supabase Advisor warnings reviewed at this cut. **Global platform security is still not closed.**

Current Security Advisor warnings include, among other existing objects:

- anonymous GraphQL exposure for objects such as `agis_public_catalog`, `cashback_tiers`, `free_round_tiers` and `promo_offers`;
- authenticated GraphQL exposure for multiple audit, wallet/casino, profile, project, observability, node and usage objects;
- exposed `SECURITY DEFINER` RPC warnings including `get_public_leaderboard`, `get_public_recent_wins`, `get_my_crash_history` and `get_my_slot_history` according to role;
- leaked-password protection disabled.

Remediation must remain **object-by-object, validation-first and contract-aware**. Do not revoke or rewrite grants/RLS/functions in bulk merely to make Advisor output shorter.

Current Performance Advisor information includes unindexed canonical-AGI foreign keys on:

- `agi_agent_tools.canonical_agi_id`;
- `agi_agents.canonical_agi_id`;
- `agi_memory_mirror.canonical_agi_id`.

It also reports many unused indexes, including `agi_messages_session_created_idx`. **Do not drop an index solely because it is currently reported unused**; verify real workload, query plans, retention window and rollback impact first.

## 5. Provider-documentation watch — verified before future runtime changes

The runtime is stable enough to avoid a reactive provider rewrite. However, current official provider documentation creates explicit follow-up gates:

### Supabase

- RLS and grants are separate controls; exposed database objects require least-privilege grants plus appropriate RLS.
- Functions are not protected by table RLS; `EXECUTE` privileges and `SECURITY DEFINER` behavior require explicit review.
- Keep privileged RPC inputs validated, `search_path` fixed, and EXECUTE scopes minimal.

Decision: **no immediate P0 RPC migration** from this alignment alone. First produce compatibility tests and a validation migration if a schema/private-function move is proposed.

### OpenAI

- Provider-side response persistence is not the HOCKER memory source of truth.
- For HOCKER-managed continuity, direct OpenAI inference should keep provider storage disabled where the active API contract supports it and retain canonical state in HOCKER's own session store.

Decision: provider conversation state remains non-authoritative.

### Google Gemini

- Current official documentation recommends the newer Interactions API for new agentic interaction patterns while `generateContent` remains a supported/legacy content-generation path during transition.
- Current Gemini key documentation requires planning migration away from legacy standard API keys toward the newer auth-key model; re-verify the effective deadline and project eligibility immediately before rollout.

Decision: create a **planned compatibility migration**, not an emergency production rewrite. New adapter work must be regression-tested and provider-key changes are treated as secret/config change control.

### Vercel AI Gateway

- Gateway routing/fallback capabilities remain useful as one route, but Gateway is not allowed to become the single point of failure for AGI identity or durable memory.
- Provider routing configuration is operational configuration and requires regression/observability evidence when changed.

### Anthropic / Ollama

- Direct provider adapters remain optional fallback routes only when explicitly configured and tested.
- Their presence in code does not count as provider readiness without valid credentials, connectivity and successful evidence.

## 6. Canonical-document drift to reconcile

The approved 2026-08-05 PDFs remain human publications but are stale on mutable platform facts. The next formal publication cycle must reconcile at least:

- DOC-00: current engineering inventory and validation-environment classification;
- DOC-05: provider-independent Hocker One NOVA runtime as primary, dedicated `nova.agi` as compatibility/fallback unless independently re-certified; current repository/platform inventory;
- DOC-06: global `agi_sessions` / `agi_messages` memory contract, provider-independent routing and current fallback/tool policy;
- DOC-07: current Advisor findings and the fact that P0 session tables have explicit fail-closed policies/grants;
- DOC-11: exact-head CI/CodeQL/Vercel evidence, provider migration watch items and current production recovery authority.

Repository count remains separate from the **10 canonical apps**. AGI engineering inventory remains separate from the **16 canonical AGIs**.

## 7. Non-authorizations

This alignment does **not** authorize:

- reverting or reapplying P0;
- direct changes to `main` outside normal review gates;
- bulk Supabase grant/RLS changes;
- destructive database cleanup or index removal;
- enabling material AGI actions;
- automatic Context Bridge activation;
- secret/key rotation without a coordinated change window;
- real-money casino or wallet activation;
- promotion of dedicated `nova.agi` to mandatory primary runtime without current health/E2E evidence;
- claims that the ecosystem is 100% complete merely because P0, CI and deployment are green.

## 8. Next evidence gates

1. Reconcile `LAST_KNOWN_STATE.md` and active Context Bridge checkpoints to current production authority.
2. Reconcile PR/closure evidence against current `main`, not the old #214 merge head.
3. Audit current Supabase Advisor warnings object-by-object and prepare narrow validation-first remediations.
4. Revalidate dedicated `nova.agi` deployment/health only if it is needed as an actual continuity fallback.
5. Execute authenticated NOVA E2E/provider-fallback drills through a controlled test identity and avoid polluting production memory with arbitrary test traffic.
6. Generate real 16-AGI eval/tool evidence through Owner+AAL2 rather than inserting passing evidence manually.
7. Freeze a later release candidate only after web/PWA/mobile, security, rollback, observability and continuity gates have evidence.
8. Publish updated canonical DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 from approved editable sources after the evidence set is frozen.

## 9. Evidence references for this snapshot

- GitHub `main` ref and exact commit `a32a0a01c8198477d542e201889f80d21a13573f`.
- GitHub Actions exact-head CI run `31985692151` and CodeQL run `31985691861`.
- Vercel deployment `dpl_EF3RTXT7XfxS7nGTAz8jb187PT31` and 24-hour runtime error-cluster query.
- Supabase production migration ledger through `20260817013714`.
- Supabase read-only P0 table/policy/grant/function verification at this evidence cut.
- Supabase Security and Performance Advisor reads at this evidence cut.
- Official Supabase database/RLS/API-security documentation reviewed before this reconciliation.
- Official OpenAI Responses data-controls documentation reviewed before this reconciliation.
- Official Google Gemini API/API-key documentation reviewed before this reconciliation.
- Official Vercel AI Gateway routing/fallback documentation reviewed before this reconciliation.
- Official Anthropic Messages and Ollama chat API documentation reviewed before this reconciliation.

Mutable provider documentation and production configuration must be re-queried before any future implementation that depends on them.
