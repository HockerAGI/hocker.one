# HOCKER — Last Known State

Status: **RECOVERY SNAPSHOT — VERIFY MUTABLE FACTS BEFORE ACTING**  
Captured evidence cut: **2026-08-17T01:46:00Z** / 2026-08-16 America/Tijuana.  
Scope: Hocker One + NOVA + canonical AGI core, with current production authority and ecosystem/provider continuity notes.

This file is an emergency resume card, not the live database. Always re-query GitHub, Supabase, Vercel and any runtime/provider that will be changed. Detailed post-P0 reconciliation lives in `DOC_ALIGNMENT_2026-08-17.md`; historical alignment snapshots remain immutable evidence.

## 1. Exact continuation point

Current workstream: **HOCKER Core — evidence-backed integration closure**.

Goal: finish Hocker One + NOVA + the 16 canonical AGIs as a stable integration/control platform before expanding unrelated product work, without enabling regulated or material actions by implication.

### Current production authority

- Hocker One `main`: `a32a0a01c8198477d542e201889f80d21a13573f`.
- P0 provider-independent runtime/memory commit `a8b736940900dd78c79097a8bb9f4f7808c60f7c` is already an ancestor of current `main`; **do not reapply it**.
- PR #214 is already merged; merge commit `945ed9cdeda909faa9823230d2a4f47ff84173c7` is historical production ancestry, not the current head.
- Current Vercel production deployment: `dpl_EF3RTXT7XfxS7nGTAz8jb187PT31` = **READY**, sourced from exact current `main` SHA above.
- Current exact-head GitHub Actions CI: run `31985692151` / #754 = **SUCCESS**.
- Current exact-head CodeQL default setup: run `31985691861` = **SUCCESS**.
- Vercel runtime-error cluster query for the reviewed 24-hour window returned **no runtime errors**.

Do not treat the absence of runtime errors as authenticated NOVA E2E proof.

## 2. Repository/product inventory rule

The latest connected ecosystem inventory established **9 engineering repositories**. That inventory is distinct from the canonical product catalog.

Canonical counts remain:

- **10 applications**;
- **16 AGIs**.

Repository count must never be converted into app count. Individual repository heads were not all re-queried in this evidence cut; query the target repository before any mutation.

## 3. NOVA state

### Primary runtime

Hocker One is now the primary NOVA runtime path with:

- provider-independent inference routing;
- durable canonical `agi_sessions` / `agi_messages`;
- bounded context reconstruction;
- Hocker MCP registry reuse;
- Owner Gate deferral for material tool actions;
- dedicated `nova.agi` retained as compatibility/fallback architecture.

Provider/model selection is internal telemetry and never changes NOVA's public identity.

### Dedicated `nova.agi`

Dedicated runtime deployment/health was **not revalidated in this checkpoint**. Do not promote it from compatibility/fallback to mandatory primary dependency based on older evidence. If continuity requires it, re-query exact deployment, readiness endpoint, logs/heartbeat and authenticated Hocker One→NOVA fallback behavior first.

## 4. AGI evidence state — current read-only snapshot

Current production registry/query evidence:

- canonical AGI rows: **16**;
- `allow_actions=false`: **16/16**;
- runtime metadata status: **10 `active`, 5 `guarded`, 1 `planned`**;
- Hocker One AGI runs: **39 total**;
- completed Hocker One AGI runs: **2**;
- `agi_feedback` rows `agi_eval_result`: **0**;
- `agi_feedback` rows `agi_tool_eval_result`: **0**.

The runtime metadata vocabulary above is not the same as the canonical documentary lifecycle vocabulary (`live`, `integration`, `development`, `protected`, etc.). Do not translate one into the other without an explicit mapping contract.

There is still no durable 16/16 eval/tool-eval evidence. Do not insert passing rows manually. Certification must use the governed eval path and preserve Owner+AAL2 requirements where configured.

## 5. P0 durable-memory production invariants

Primary Supabase project: `yvuibbcuntqpyqiuqggd`.

Current read-only counts:

- `nova_threads`: **114**;
- `nova_messages`: **238**;
- `agi_sessions`: **116**;
- `agi_messages`: **238**;
- `llm_usage`: **109**;
- legacy NOVA threads with verified `user_id`: **1**;
- `agi_sessions.legacy_sync_state='pending_reconcile'`: **0**;
- duplicate `(session_id, message_key)` groups: **0**.

Current P0 database boundary:

- `agi_sessions` and `agi_messages` have RLS enabled and explicit deny-direct-access policies;
- no `anon`/`authenticated` table grants were observed on those two tables;
- `service_role` table access is limited to `SELECT`, `INSERT`, `UPDATE`, `DELETE`;
- P0 `SECURITY DEFINER` RPCs checked at this cut use `search_path=public`, are not executable by `anon`/`authenticated`, and are executable by `service_role`.

This is the current observed boundary. It does not justify widening privileges or moving functions without compatibility tests.

## 6. Supabase security state

P0 session tables/RPCs are not the current Advisor blockers, but global security closure is **not complete**.

Current Security Advisor categories still requiring object-by-object review include:

- anonymous GraphQL exposure on existing public/catalog/promotion objects;
- authenticated GraphQL exposure on existing audit, finance/casino, profile, project, node, observability and usage objects;
- exposed `SECURITY DEFINER` RPC warnings for public/restricted history and leaderboard functions;
- leaked-password protection disabled.

Current Performance Advisor also reports three unindexed canonical-AGI foreign keys on `agi_agent_tools`, `agi_agents` and `agi_memory_mirror`, plus many unused-index INFO notices.

Rules:

- do not mass-revoke grants/RLS merely to clear Advisor output;
- validate each consumer and authorization path first;
- do not drop an index solely because Advisor reports it unused;
- use validation-first migrations, rollback evidence and post-DDL Advisors;
- do not reset/rebase Supabase Branching blindly.

## 7. Current provider-documentation watch

Official provider documentation was rechecked before this snapshot. Relevant future-change gates:

- **Supabase:** table RLS does not replace grants; functions require explicit EXECUTE/`SECURITY DEFINER` review. Keep privileged RPCs narrow and validated.
- **OpenAI:** provider conversation storage is not HOCKER memory authority; preserve HOCKER-managed durable state and disable provider-side storage where the active API contract supports it.
- **Gemini:** plan migration toward the newer interaction/auth model and reverify the current key-transition deadline immediately before implementation; do not perform an emergency rewrite while production is stable.
- **Vercel AI Gateway:** remains one inference route, not a memory/identity dependency or single point of failure.
- **Anthropic/Ollama:** code presence is not readiness; require explicit configuration, connectivity and verified inference evidence.

Any provider/model/key change is a software/configuration change and must have regression evidence and rollback.

## 8. Context Bridge / Memory Mirror

This checkpoint did **not** re-query Context Bridge manifests/checkpoints or Memory Mirror publication counts. Therefore the previous values must not be promoted as current here.

Operational rule remains:

- Context Bridge = current operational continuity/evidence;
- Memory Mirror = reviewed reusable knowledge;
- do not copy raw provider state, secrets, credentials or arbitrary chat history into Memory Mirror to make it look fresh;
- do not auto-activate a Context Bridge manifest; retain Owner + MFA/AAL2 activation controls.

Re-query those stores before using freshness/completeness claims.

## 9. Canon/documentation state

The approved 2026-08-05 canonical PDFs remain authoritative human publications within their evidence level, but mutable technical facts have drifted.

The new `DOC_ALIGNMENT_2026-08-17.md` records current differences, including:

- P0 already live in current `main`/Supabase;
- Hocker One primary provider-independent NOVA runtime;
- dedicated `nova.agi` as compatibility/fallback unless independently re-certified;
- current production CI/CodeQL/Vercel authority;
- current P0 database invariants;
- current global Supabase security blockers;
- provider-documentation migration watch items.

Formal next-edition reconciliation is required for DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 after the evidence set is frozen. Do not silently rewrite historical PDFs as if they had always described the new architecture.

## 10. Next actions in order

1. Keep this documentation reconciliation isolated until reviewed; do not move `main` because a snapshot changed.
2. Reconcile active Context Bridge checkpoints/manifest to the new production authority without auto-activation.
3. Refresh global closure/ledger evidence against current `main`, not the old #214 merge head.
4. Execute real 16/16 AGI eval/tool-eval evidence through the governed Owner+AAL2 path.
5. Classify and remediate Supabase Advisor findings in narrow validation-first slices.
6. Revalidate dedicated NOVA fallback only if it is required for continuity; do not make it primary by documentation alone.
7. Run authenticated NOVA E2E/provider-fallback drills with controlled test identities/data so production memory is not polluted by arbitrary test traffic.
8. Complete web/PWA/mobile, accessibility/performance, rollback/runbook and observability evidence before freezing a release candidate.
9. Rotate secrets only in a coordinated, explicitly authorized window after dependencies and rollback are mapped.
10. Declare `HOCKER Core — VERIFIED / INTEGRATION READY` only when every named gate has traceable evidence.

## 11. Non-authorizations

This snapshot does not authorize:

- reapplying/reverting P0;
- direct `main` changes without review gates;
- production DDL outside a validated change slice;
- bulk Supabase security mutations;
- enabling AGI material actions;
- Context Bridge auto-activation;
- destructive cleanup/index deletion;
- secret rotation;
- casino/wallet regulated activation;
- claims of 100% ecosystem completion.

## 12. Handoff rule

At every material milestone:

1. query mutable production facts first;
2. record exact SHA/deployment/migration/evidence IDs;
3. update operational continuity evidence;
4. preserve prior snapshots as history;
5. never convert a stale snapshot into authority by repetition.
