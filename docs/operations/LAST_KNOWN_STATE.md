# HOCKER — Last Known State

Status: **RECOVERY SNAPSHOT — VERIFY MUTABLE FACTS BEFORE ACTING**  
Captured evidence cut: **2026-08-17T02:30:00Z** / 2026-08-16 America/Tijuana.  
Scope: Hocker One + NOVA + canonical AGI core, with current production/security continuity evidence.

This is an emergency resume card, not the live database. Always re-query GitHub, Supabase, Vercel and any provider/runtime that will be changed. Detailed reconciliation lives in `DOC_ALIGNMENT_2026-08-17.md`.

## 1. Exact continuation point

Current workstream: **HOCKER Core — evidence-backed integration closure**.

Goal: finish Hocker One + NOVA + the 16 canonical AGIs as a stable control/integration platform before unrelated expansion, without enabling regulated or material actions by implication.

### Current production authority

- Hocker One `main`: `f122b15c8136c8885edfd24396115c6bda1b6329`.
- Current production Vercel deployment: `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf` = **READY**, exact source SHA `f122b15c…`.
- GitHub Actions post-merge CI #757 / run `31988067943`: **SUCCESS**.
- GitHub CodeQL post-merge run `31988066897`: **SUCCESS**.
- Post-deploy Vercel runtime error-cluster read for the reviewed 1-hour window: **no runtime errors found**.
- PR #221 is merged and no longer a candidate.
- P0 provider-independent runtime/memory is already production ancestry; **do not reapply it**.

Do not treat green CI/deploy/no-errors as authenticated NOVA E2E proof.

## 2. Portfolio/inventory rule

Latest connected ecosystem inventory established **9 engineering repositories**, which is not the product catalog.

Canonical counts remain:

- **10 applications**;
- **16 AGIs**.

Individual repository heads outside Hocker One were not re-queried in this checkpoint. Query the specific repo before mutation.

## 3. NOVA state

Hocker One is the primary NOVA runtime path with:

- provider-independent inference routing;
- durable canonical `agi_sessions` / `agi_messages`;
- bounded context reconstruction;
- Hocker MCP registry reuse;
- Owner Gate deferral for material tool actions;
- dedicated `nova.agi` retained as compatibility/fallback architecture.

Provider/model selection is internal telemetry and does not change NOVA's public identity.

Dedicated `nova.agi` deployment/health was **not re-certified in this checkpoint**. Re-query deployment, readiness, logs/heartbeat and authenticated fallback behavior before treating it as a required continuity dependency.

## 4. AGI evidence state

Latest read-only production snapshot:

- canonical AGIs: **16**;
- `allow_actions=false`: **16/16**;
- runtime metadata: **10 `active`, 5 `guarded`, 1 `planned`**;
- Hocker One AGI runs: **39 total**;
- completed runs: **2**;
- durable `agi_eval_result`: **0**;
- durable `agi_tool_eval_result`: **0**.

Runtime metadata state is not equivalent to documentary lifecycle state. There is still no 16/16 eval/tool-eval evidence; never insert passing rows manually to create certification.

## 5. Durable-memory production invariants

Primary Supabase project: `yvuibbcuntqpyqiuqggd`.

Latest P0 read-only counts:

- `nova_threads`: **114**;
- `nova_messages`: **238**;
- `agi_sessions`: **116**;
- `agi_messages`: **238**;
- `llm_usage`: **109**;
- `agi_sessions.legacy_sync_state='pending_reconcile'`: **0**;
- duplicate `(session_id, message_key)` groups: **0**.

P0 tables remain fail-closed for direct client access under the observed grants/RLS boundary. Re-query before any privilege or RPC change.

## 6. Closed security slice — PR #221

A latent membership-governance defect was reproduced in validation when authenticated write grants were enabled: `project_members` write policies used `private.is_project_admin(project_id)`, and that helper includes `operator`.

Remediation:

- only the three `project_members` write policies were narrowed to `private.is_project_owner_or_admin(project_id)`;
- global `private.is_project_admin()` was deliberately not changed;
- validation proved operator→owner was blocked after the fix and legitimate owner→viewer remained allowed;
- validation fixture was cleaned up.

Production/source parity:

- remote migration: `20260817021859` / `project_members_owner_admin_write_hardening_20260816`;
- source: `supabase/migrations/20260817021859_project_members_owner_admin_write_hardening.sql`;
- SQL blob SHA: `40e7d2d5b2105181553a742c89dda8d0ecd54ad3`;
- membership aggregate after migration: **3 owners**;
- `authenticated` effective privileges on `project_members`: SELECT=true, INSERT=false, UPDATE=false, DELETE=false;
- all three write policies now use `private.is_project_owner_or_admin(project_id)`.

Severity nuance: because current production authenticated write grants are false, the defect was a **latent authorization boundary / defense-in-depth risk**, not evidence of an actively exploitable production escalation at the current grant state.

## 7. Remaining Supabase security state

Global closure is still open. Current Advisor categories requiring object-by-object triage include:

- anon GraphQL exposure on public/catalog/promotion objects;
- authenticated GraphQL exposure across audit, finance/casino, profile, project, node, observability and usage objects;
- exposed `SECURITY DEFINER` RPC warnings;
- leaked-password protection disabled.

Important: an Advisor “exposed to authenticated” warning is not automatically a leak; verify RLS and real application consumers first. Do not mass-revoke authenticated access or change `is_project_admin()` globally.

Performance Advisor also reports three unindexed canonical-AGI foreign keys on `agi_agent_tools`, `agi_agents` and `agi_memory_mirror`, plus many unused-index INFO notices. Do not drop indexes solely from Advisor output.

## 8. Context Bridge / Memory Mirror

Context Bridge and Memory Mirror were **not re-queried after PR #221 in this checkpoint**. Therefore previous freshness/count values must not be repeated as current authority.

Rules remain:

- Context Bridge = operational continuity/evidence;
- Memory Mirror = reviewed reusable knowledge;
- do not copy secrets, provider credentials, raw chats or arbitrary operational state into Memory Mirror;
- do not auto-activate a Context Bridge manifest; retain Owner + MFA/AAL2 controls.

Re-query before any freshness/completeness claim or activation.

## 9. Provider-documentation watch

Official provider documentation was reviewed before the runtime/security work. Re-query official docs immediately before provider-specific changes.

- Supabase: RLS and grants are separate; privileged function EXECUTE/`SECURITY DEFINER` requires explicit review.
- OpenAI: HOCKER durable state remains the memory authority; provider state is non-authoritative.
- Gemini: compatibility/auth migration must follow the active official deadline at implementation time, not a stale snapshot.
- Vercel AI Gateway: one routing option, never the memory/identity source of truth or single point of failure.
- Anthropic/Ollama: adapter presence is not readiness; require config/connectivity/evidence.

## 10. Canon/documentation state

The approved 2026-08-05 PDFs remain human publications for their evidence date, but mutable technical facts have drifted.

`DOC_ALIGNMENT_2026-08-17.md` on this branch records:

- current `main=f122b15c…`;
- exact post-merge CI/CodeQL/Vercel authority;
- P0 runtime/memory production state;
- PR #221 validation/remediation/source↔remote migration parity;
- remaining global Supabase security work;
- provider-documentation watch;
- next formal DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 reconciliation needs.

Do not silently rewrite historical PDFs as if they always described the current architecture.

## 11. Next actions in order

1. Re-query and reconcile active Context Bridge checkpoints/manifest to `main=f122b15c…` without auto-activation.
2. Continue Supabase Advisor triage object-by-object, separating Hocker One core from regulated/other-app domains.
3. Execute real 16/16 AGI eval/tool-eval evidence through the governed Owner+AAL2 path.
4. Revalidate dedicated NOVA fallback only if required for continuity.
5. Run controlled authenticated NOVA E2E/provider-fallback drills without polluting production memory.
6. Complete web/PWA/mobile, accessibility/performance, rollback/runbook and observability evidence before freezing an RC.
7. Publish revised canonical DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 only after evidence is frozen and approved.
8. Rotate secrets last in an explicitly authorized coordinated window.
9. Declare `HOCKER Core — VERIFIED / INTEGRATION READY` only when every named gate has traceable evidence.

## 12. Non-authorizations

This snapshot does not authorize:

- reapplying/reverting P0;
- bulk Supabase security changes;
- changing the global role helper without consumer analysis;
- enabling AGI material actions;
- Context Bridge auto-activation;
- destructive cleanup/index deletion;
- secret rotation;
- casino/wallet regulated activation;
- claims of 100% ecosystem completion.

## 13. Handoff rule

At every material milestone:

1. query mutable production facts first;
2. record exact SHA/deployment/migration/evidence IDs;
3. update operational continuity evidence;
4. preserve prior snapshots as history;
5. never turn a stale snapshot into authority by repetition.
