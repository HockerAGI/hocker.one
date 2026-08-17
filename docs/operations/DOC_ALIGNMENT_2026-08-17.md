# HOCKER — DOC-ALIGNMENT / Estado observable — 2026-08-17

Status: **ACTIVE ALIGNMENT EVIDENCE — NOT A RELEASE AUTHORIZATION**  
Evidence cut: **2026-08-17T02:30:00Z** / 2026-08-16 America/Tijuana.  
Scope: Hocker One + NOVA + canonical AGI core, with GitHub/Vercel/Supabase production authority, post-P0 reconciliation and security-closure evidence.

Baseline rule: **production/configuration > `main`/migrations > executable contracts/tests > approved evidence > canonical publications > historical material**.

This document does not replace the approved 2026.08 canonical publications. It records factual drift for the next DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 publication cycle. Historical snapshots remain immutable evidence.

## 1. Current production authority

### Hocker One GitHub

- Repository: `HockerAGI/hocker.one`.
- Current `main`: `f122b15c8136c8885edfd24396115c6bda1b6329`.
- PR #221 was squash-merged with exact-head protection after validation and exact-head checks.
- P0 provider-independent runtime/memory remains production ancestry and must not be reapplied as a new candidate.

### Exact-head post-merge verification

For `main` `f122b15c8136c8885edfd24396115c6bda1b6329`:

- GitHub Actions CI run `31988067943` / #757: **SUCCESS**.
- GitHub CodeQL push run `31988066897`: **SUCCESS**.
- The production migration source `20260817021859_project_members_owner_admin_write_hardening.sql` exists in `main` with SQL blob SHA `40e7d2d5b2105181553a742c89dda8d0ecd54ad3`.

These checks prove the repository candidate built, tested and passed static analysis. They do not by themselves prove every authenticated product flow or provider path end-to-end.

### Vercel production

- Project: `hocker-one` / `prj_QoUSRUZj4LQmB3qoRF3bnoFOFQPz`.
- Team: `Hocker AGI` / `team_nEtACFYtjltFLERznYyZ40pK`.
- Current production deployment: `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf`.
- Deployment source SHA: `f122b15c8136c8885edfd24396115c6bda1b6329`.
- Deployment state: **READY**.
- Runtime error-cluster query for the reviewed post-deploy 1-hour window: **no runtime errors found**.

Absence of recorded runtime errors is an operational signal, not authenticated NOVA E2E or load-test proof.

## 2. P0 provider-independent runtime and durable memory

P0 is already part of current `main` and the primary Supabase migration chain.

Observed durable-memory invariants from the latest P0 read-only snapshot:

- legacy `nova_threads`: **114**;
- legacy `nova_messages`: **238**;
- canonical `agi_sessions`: **116**;
- canonical `agi_messages`: **238**;
- `llm_usage`: **109**;
- canonical sessions in `pending_reconcile`: **0**;
- duplicate `(session_id, message_key)` groups: **0**.

These are inventory/invariant counts, not completion percentages.

Observed P0 access boundary:

- `agi_sessions` and `agi_messages`: RLS enabled with explicit deny-direct-access intent;
- no `anon`/`authenticated` direct table grants observed on those two tables;
- checked privileged P0 RPCs use fixed `search_path`, are not executable by `anon`/`authenticated`, and remain service-side only.

## 3. NOVA architecture reconciliation

The 2026-08-05 architecture publication described the dedicated `nova.agi` Fastify runtime as the primary runtime. Current implementation authority has moved beyond that snapshot:

- Hocker One contains the provider-independent model router and durable canonical conversation store;
- Hocker One is the primary NOVA chat/runtime path;
- dedicated `nova.agi` remains compatibility/fallback architecture unless independently re-certified with current deployment, health and E2E evidence;
- provider/model identity is internal telemetry, not NOVA's public identity;
- material tool writes remain under Hocker One Owner Gate;
- model/provider/config changes remain software changes requiring regression evidence and rollback.

DOC-05 and DOC-06 must reflect this in the next formal edition.

## 4. AGI evidence state

Latest read-only registry/evidence snapshot:

- canonical AGIs: **16**;
- `allow_actions=false`: **16/16**;
- runtime metadata: **10 `active`, 5 `guarded`, 1 `planned`**;
- Hocker One AGI runs: **39 total**;
- completed Hocker One AGI runs: **2**;
- durable `agi_eval_result` rows: **0**;
- durable `agi_tool_eval_result` rows: **0**.

Runtime metadata state is not interchangeable with documentary lifecycle state (`live`, `integration`, `development`, `protected`, etc.). No 16/16 certification claim is authorized without real eval/tool-eval evidence.

## 5. Security closure: project membership write boundary

### Finding

Production policies for `project_members` INSERT/UPDATE/DELETE previously called `private.is_project_admin(project_id)`, while that helper intentionally includes `operator` for other operational surfaces. `project_members.role` is free text and had no independent role CHECK/trigger preventing a privileged target role.

A validation fixture with the production policy/helper semantics and authenticated write grants reproduced the latent boundary defect:

- before hardening: synthetic `operator` could insert a synthetic `owner` membership;
- after hardening: the same attempt failed with PostgreSQL `42501` RLS rejection;
- positive control: a legitimate synthetic `owner` could still insert a `viewer`.

The validation fixture was then removed and its prior state restored.

### Production severity nuance

Current production effective privileges were verified as:

- `authenticated SELECT = true`;
- `authenticated INSERT = false`;
- `authenticated UPDATE = false`;
- `authenticated DELETE = false`.

Therefore the defect was a **latent authorization boundary / defense-in-depth risk**, not evidence of an actively exploitable escalation under the current production grants.

### Remediation

Only the three membership write policies were narrowed to `private.is_project_owner_or_admin(project_id)`. The global `private.is_project_admin()` helper was deliberately left unchanged to avoid breaking operational surfaces that may intentionally include `operator`.

Production migration:

- remote version: `20260817021859`;
- remote name: `project_members_owner_admin_write_hardening_20260816`;
- source filename in `main`: `20260817021859_project_members_owner_admin_write_hardening.sql`.

Post-merge verification:

- membership aggregate remains `owner: 3`;
- all three write policies use `private.is_project_owner_or_admin(project_id)`;
- migration version is present in the remote ledger;
- `authenticated` remains SELECT-only on `project_members`;
- no new Advisor warning specific to this migration was introduced.

This closes PR #221's scoped defect. It does **not** close the entire Supabase security program.

## 6. Remaining Supabase security posture

Global security closure remains open. Current Advisor categories requiring object-by-object review include:

- anonymous GraphQL exposure on public/catalog/promotion objects;
- authenticated GraphQL exposure across audit, finance/casino, profile, project, node, observability and usage objects;
- exposed `SECURITY DEFINER` RPC warnings, including public/restricted history and leaderboard functions;
- leaked-password protection disabled.

Important triage rule: an Advisor warning about an object exposed to `authenticated` is **not automatically a data leak**. RLS and application consumers must be inspected before revoking grants. Hocker One intentionally uses session-scoped access to objects such as `project_members` and node/control surfaces.

Performance Advisor also reports unindexed canonical-AGI foreign keys on:

- `agi_agent_tools.canonical_agi_id`;
- `agi_agents.canonical_agi_id`;
- `agi_memory_mirror.canonical_agi_id`.

Many unused-index INFO notices also remain. Do not remove an index solely because Advisor reports it unused; confirm workload/query plans and rollback first.

## 7. Provider-documentation watch

Current official provider documentation was reviewed before the runtime/security work. Future changes must re-query the official source immediately before implementation.

- **Supabase:** grants and RLS are separate controls; privileged functions require explicit EXECUTE/`SECURITY DEFINER` review.
- **OpenAI:** HOCKER durable memory remains authoritative; provider conversation storage is not the memory source of truth.
- **Gemini:** plan compatibility work for current interaction/auth direction only after rechecking active migration/deprecation deadlines; do not rewrite stable production reactively.
- **Vercel AI Gateway:** remains one inference route, not a single point of failure for identity or durable memory.
- **Anthropic/Ollama:** adapter code does not equal readiness; require configuration, connectivity and verified inference evidence.

## 8. Canonical-document drift

The approved 2026-08-05 PDFs remain valid human publications within their evidence date, but mutable facts have drifted. Next formal publications must reconcile at least:

- DOC-00: current engineering inventory, validation-environment classification and evidence hierarchy;
- DOC-05: Hocker One provider-independent NOVA runtime as primary, dedicated runtime as compatibility/fallback unless re-certified, current infrastructure inventory;
- DOC-06: canonical `agi_sessions` / `agi_messages`, provider-independent routing, current tool/fallback governance;
- DOC-07: current Advisor findings, P0 fail-closed controls and the closed project-membership policy slice;
- DOC-11: current exact-head CI/CodeQL/Vercel/migration evidence and recovery authority.

Repository inventory remains separate from the **10 canonical apps**. Engineering/runtime state remains separate from the **16 canonical AGIs**.

## 9. Non-authorizations

This alignment does **not** authorize:

- reapplying/reverting P0;
- bulk Supabase grants/RLS changes;
- destructive cleanup/index deletion;
- enabling AGI material actions;
- Context Bridge auto-activation;
- secret/key rotation outside a coordinated window;
- real-money casino/wallet activation;
- dedicated `nova.agi` becoming mandatory primary without current health/E2E evidence;
- claims that HOCKER Core or the whole ecosystem is 100% complete.

## 10. Next evidence gates

1. Reconcile `LAST_KNOWN_STATE.md` and Context Bridge checkpoints to `main=f122b15c…` without auto-activation.
2. Continue Supabase Advisor triage object-by-object, separating Hocker One core from regulated/other-app domains.
3. Generate real 16/16 AGI eval/tool-eval evidence through the governed Owner+AAL2 path; never insert passing rows manually.
4. Revalidate dedicated NOVA fallback only if required for continuity.
5. Run controlled authenticated NOVA E2E/provider-fallback drills without polluting production memory with arbitrary traffic.
6. Complete web/PWA/mobile, accessibility/performance, rollback/runbook and observability evidence before freezing an RC.
7. Publish revised canonical DOC-00/DOC-05/DOC-06/DOC-07/DOC-11 only after the evidence set is frozen and approved.
8. Rotate secrets last, in an explicitly authorized coordinated window.

## 11. Evidence references for this snapshot

- GitHub `main`: `f122b15c8136c8885edfd24396115c6bda1b6329`.
- GitHub Actions CI #757 / run `31988067943`: SUCCESS.
- GitHub CodeQL push run `31988066897`: SUCCESS.
- Vercel production `dpl_4ouB2HxXuNBkz3PBu8xDo5EQi7Pf`: READY, source SHA `f122b15c…`.
- Vercel runtime-error read, reviewed 1-hour post-deploy window: no errors found.
- Supabase migration ledger entry `20260817021859` / `project_members_owner_admin_write_hardening_20260816`.
- Supabase read-only post-merge membership-policy/grant verification.
- PR #221 validation, positive-control and exact-head CI/CodeQL/Preview evidence.

Mutable production/provider facts must be re-queried before future implementation.