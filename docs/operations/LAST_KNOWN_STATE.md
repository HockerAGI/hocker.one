# HOCKER — Last Known State

Status: **RECOVERY SNAPSHOT — VERIFY MUTABLE FACTS BEFORE ACTING**  
Captured evidence cut: **2026-08-17** / America/Tijuana.  
Scope: Hocker One + NOVA + canonical AGI core.

This file is a recovery card, not a live control plane. **Never treat an embedded `main` SHA, deployment ID, migration ledger head or provider state as current without re-querying it.** A documentation-only merge can advance Git/Vercel without changing runtime behavior.

Operational interpretation is governed by `DOC_ALIGNMENT_2026-08-17-R1.md`. The earlier `DOC_ALIGNMENT_2026-08-17.md` remains historical evidence for the post-#221 functional cut.

## 1. Continuation model

Every continuation must distinguish:

- **mutable pointers** — Git `main`, current production deployment, remote migration head and provider/runtime state; always re-query before acting;
- **latest functional authority** — last code/runtime/migration/security change with completed evidence gates;
- **documentation-only ancestry** — commits/deployments that may move pointers without changing runtime;
- **open evidence gates** — blockers that still prevent a completion claim.

## 2. Latest functional authority verified at this recovery cut

Latest runtime/security-affecting Hocker One commit verified:

- `f122b15c8136c8885edfd24396115c6bda1b6329` — PR #221 security closure.

Evidence attached to that functional change:

- GitHub Actions CI #757 / run `31988067943`: **SUCCESS**;
- GitHub CodeQL run `31988066897`: **SUCCESS**;
- Vercel functional deployment `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf`: **READY**;
- reviewed post-deploy runtime-error window: **no runtime errors found**;
- production migration `20260817021859` / `project_members_owner_admin_write_hardening_20260816` registered remotely;
- source migration `supabase/migrations/20260817021859_project_members_owner_admin_write_hardening.sql` present with SQL blob SHA `40e7d2d5b2105181553a742c89dda8d0ecd54ad3`.

These IDs are frozen evidence for the functional change. They do not claim to be the newest Git/Vercel pointers forever.

## 3. Mutable pointers observed during the R1 semantic correction

At the time `DOC_ALIGNMENT_2026-08-17-R1.md` was prepared, the following were observed:

- Git `main`: `9dfdc688f73f6cad69c40179c1bb3a0a831bbb45`;
- that SHA is the documentation-only squash merge of PR #222;
- Vercel production `dpl_Eaa9Gi3XYWa4ZzWLTL9hFuaA9cCR`: **READY**, source SHA `9dfdc688…`;
- CodeQL for the docs-only `main` merge: run `31988626675` — **SUCCESS**;
- application CI was intentionally skipped because `.github/workflows/ci.yml` ignores `**/*.md`.

**Do not use these as current pointers without re-querying them.** A later documentation or code merge may have advanced them.

## 4. Portfolio/inventory rule

Latest connected ecosystem inventory established **9 engineering repositories**, which is not the canonical product catalog.

Canonical counts remain:

- **10 applications**;
- **16 AGIs**.

Repository count must never be translated into app count. Re-query the exact repository before mutation.

## 5. NOVA state

Hocker One is the primary NOVA runtime path with:

- provider-independent inference routing;
- durable canonical `agi_sessions` / `agi_messages`;
- bounded context reconstruction;
- Hocker MCP registry reuse;
- Owner Gate deferral for material tool actions;
- dedicated `nova.agi` retained as compatibility/fallback architecture.

Provider/model selection is internal telemetry and does not change NOVA's public identity.

Dedicated `nova.agi` deployment/health was **not re-certified in this recovery cut**. Re-query deployment, readiness, logs/heartbeat and authenticated fallback behavior before treating it as a required continuity dependency.

## 6. AGI evidence state

Latest verified read-only AGI snapshot in this recovery chain:

- canonical AGIs: **16**;
- `allow_actions=false`: **16/16**;
- runtime metadata: **10 `active`, 5 `guarded`, 1 `planned`**;
- Hocker One AGI runs: **39 total**;
- completed runs: **2**;
- durable `agi_eval_result`: **0**;
- durable `agi_tool_eval_result`: **0**.

Runtime metadata state is not equivalent to documentary lifecycle state. There is still no 16/16 eval/tool-eval evidence; never insert passing rows manually to create certification.

## 7. Durable-memory production invariants

Primary Supabase project: `yvuibbcuntqpyqiuqggd`.

Latest P0 read-only counts in this recovery chain:

- `nova_threads`: **114**;
- `nova_messages`: **238**;
- `agi_sessions`: **116**;
- `agi_messages`: **238**;
- `llm_usage`: **109**;
- `agi_sessions.legacy_sync_state='pending_reconcile'`: **0**;
- duplicate `(session_id, message_key)` groups: **0**.

P0 tables were observed fail-closed for direct client access under the reviewed grants/RLS boundary. Re-query before any privilege or RPC change.

## 8. Closed security slice — PR #221

A latent membership-governance defect was reproduced in validation when authenticated write grants were enabled: `project_members` write policies used `private.is_project_admin(project_id)`, and that helper includes `operator`.

Remediation and validation:

- only the three `project_members` write policies were narrowed to `private.is_project_owner_or_admin(project_id)`;
- global `private.is_project_admin()` was deliberately left unchanged;
- validation proved operator→owner was blocked after the fix;
- legitimate owner→viewer remained allowed;
- validation fixture was cleaned and its prior state restored.

Production/source parity at closure:

- remote migration: `20260817021859` / `project_members_owner_admin_write_hardening_20260816`;
- membership aggregate after migration: **3 owners**;
- `authenticated` effective privileges on `project_members`: SELECT=true, INSERT=false, UPDATE=false, DELETE=false;
- all three write policies use `private.is_project_owner_or_admin(project_id)`.

Severity nuance: because authenticated production write grants were false, this was a **latent authorization boundary / defense-in-depth risk**, not evidence of an actively exploitable escalation under the reviewed grant state.

## 9. Remaining Supabase security state

Global security closure is still open. Current Advisor categories previously observed and requiring fresh re-query plus object-by-object triage include:

- anon GraphQL exposure on public/catalog/promotion objects;
- authenticated GraphQL exposure across audit, finance/casino, profile, project, node, observability and usage objects;
- exposed `SECURITY DEFINER` RPC warnings;
- leaked-password protection disabled.

Important: an Advisor “exposed to authenticated” warning is not automatically a leak. Verify RLS, grants, authorization helpers and real application consumers before remediation. Do not mass-revoke authenticated access or modify `is_project_admin()` globally without consumer analysis.

Performance Advisor previously reported three unindexed canonical-AGI foreign keys on `agi_agent_tools`, `agi_agents` and `agi_memory_mirror`, plus many unused-index INFO notices. Re-query before action and do not drop indexes solely from Advisor output.

## 10. Context Bridge / Memory Mirror

Context Bridge and Memory Mirror were **not re-queried after PR #221/#222 in this recovery chain**. Previous freshness/count values are therefore not current authority.

Rules remain:

- Context Bridge = operational continuity/evidence;
- Memory Mirror = reviewed reusable knowledge;
- do not copy secrets, provider credentials, raw chats or arbitrary operational state into Memory Mirror;
- do not auto-activate a Context Bridge manifest; retain Owner + MFA/AAL2 controls.

This is the next continuity subsystem that must be re-queried before any claim or change.

## 11. Provider-documentation watch

Official provider documentation was reviewed before the preceding runtime/security work. Re-query official docs immediately before provider-specific changes.

- Supabase: RLS and grants are separate; privileged function EXECUTE/`SECURITY DEFINER` requires explicit review.
- OpenAI: HOCKER durable state remains the memory authority; provider state is non-authoritative.
- Gemini: compatibility/auth migration must follow the active official deadline at implementation time, not a stale snapshot.
- Vercel AI Gateway: one routing option, never the memory/identity source of truth or single point of failure.
- Anthropic/Ollama: adapter presence is not readiness; require configuration, connectivity and evidence.

## 12. Canon/documentation state

Approved 2026-08-05 PDFs remain human publications for their evidence date, but mutable technical facts have drifted.

Active operational reconciliation chain:

- `DOC_ALIGNMENT_2026-08-17.md` — historical post-#221 functional evidence snapshot;
- `DOC_ALIGNMENT_2026-08-17-R1.md` — active semantic correction distinguishing frozen functional authority from mutable pointers;
- `LAST_KNOWN_STATE.md` — this recovery card.

Do not silently rewrite historical PDFs as if they always described the current architecture.

## 13. Next actions in order

1. **Re-query current Git/Vercel/Supabase pointers**; do not reuse the values embedded above as current without verification.
2. Re-query active Context Bridge checkpoints/manifest and Memory Mirror publication state; reconcile them against the latest functional authority without auto-activation.
3. Continue Supabase Advisor triage object-by-object, separating Hocker One core from regulated/other-app domains.
4. Execute real 16/16 AGI eval/tool-eval evidence through the governed Owner+AAL2 path.
5. Revalidate dedicated NOVA fallback only if required for continuity.
6. Run controlled authenticated NOVA E2E/provider-fallback drills without polluting production memory.
7. Complete web/PWA/mobile, accessibility/performance, rollback/runbook and observability evidence before freezing an RC.
8. Publish revised canonical DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 only after evidence is frozen and approved.
9. Rotate secrets last in an explicitly authorized coordinated window.
10. Declare `HOCKER Core — VERIFIED / INTEGRATION READY` only when every named gate has traceable evidence.

## 14. Non-authorizations

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

## 15. Handoff rule

At every material milestone:

1. query mutable pointers first;
2. identify the latest functional/runtime-affecting authority separately;
3. record exact evidence IDs for the functional change;
4. record documentation-only ancestry separately;
5. update continuity evidence without converting pointer values into permanent constants;
6. preserve prior snapshots as history.
