# Hocker One + NOVA AGI — Stale backlog gate parity

Date: 2026-11-14, America/Tijuana. Reconciliation scope: `HockerAGI/hocker.one` only. Inspected `nova.agi` and `hocker-node-agent` as dependencies; no changes to their repositories.

## Real state verified before change

- Hocker One Production Vercel `dpl_79ooGrAPaoyYZMbmrDtDgKjU6jZj` READY and SHA `f1f551087f90e838cd34fb8a0c392c23cb0b3ac8`, matching `main`; no recent aggregated runtime errors.
- Three repositories have **0 open PR** before this change.
- Supabase project `hocker-one`: 16 registered AGIs, **all `allow_actions=false`**, 14 `agi_tasks` with status `queued`/`pending`, 0 `agi_action_queue` needing Owner approval, 0 one-time `owner_gate_approvals` records, 0 project nodes with fresh heartbeats. The 14 old tasks are archived testing/scheduler pulses, not 14 current commercial authorizations.
- `nova.agi/main=cb8d1a1…` already checks `queued/pending` over 24h **before** automatic recovery and worker claim, failing closed via `AGI_WORKER_STALE_BACKLOG_REQUIRES_REVIEW`.
- **Previously unguarded in Hocker One**: `runUnifiedAgiWorkerOnce` and legacy `runServerlessAgiWorkerOnce` call `claim_next_agi_task` without the corresponding stale backlog check; `recoverStaleServerlessAgiTasks` rewrites old locks; manual `/api/agi/workers` only checks membership Owner, not current MFA AAL2. A valid runtime token can invoke unified worker via `/api/agi/serverless-worker-trigger`. The frontend offers these operations when only schema readiness is known.

## Change: fail closed before a mutation

1. Shared `src/lib/agi-stale-backlog-gate.ts` reproduces the exact dedicated-worker policy: `project_id`, `status IN ('queued','pending')`, `created_at < NOW()-24 hours`, `HEAD count: exact` only; no task payload, no write. Invalid project/clock/DB result blocks.
2. All three mutation paths (unified model worker, legacy model worker, lock recovery) invoke `assertAgiBacklogReviewed` **before any claim or recovery RPC**. Token-trigger and manual route return fixed 409/503 conflict/failed-preflight response; no actions, no inference, no recovery when stale.
3. Manual run and recovery additionally require current `requireOwnerAal2Api` after project Owner role. **Creating a task remains governed by existing owner/admin/operator membership**, without invoking a model or changing external permissions.
4. Workers GET status exposes `stale_backlog: {checked,blocked,stale_count,threshold_hours,reason}`, `execution_blocked`, and `ready=false` while unsafe. Frontend shows read-only counts and explicit warning; Process/Recover buttons disabled even if schema/models are configured; task list remains inspectable.
5. CI tests lock in guards before every RPC, count-only scope, fail-closed read error, Owner AAL2 step-up and honest UI. No migration needed, and no existing task data is rewritten by this change.

## Limits and remaining work

- A preflight is a **point-in-time** control, not an atomic transactional DB guarantee. For unattended production, keep worker OFF until task triage and implement/verify an atomic database claim-time policy if concurrency or external writers can bypass application guards.
- Do **not** clear the old backlog by changing `created_at`; do not delete all 14 rows blindly, retry the jobs, or present `status=online` as a heartbeat.
- Owner needs an audited *per-task* review/cancel/reissue flow. Any later cancellation needs task classification, Owner MFA AAL2, stable project+task constraints, reversible/auditable transaction and retained evidence. Do not change Supabase directly from this PR.
- Autonomous AGI runtime still requires real host readiness, authenticated tools and controlled model spending; this patch does not claim 24/7 execution.
- Keep `hocker.one` issue #306 and `nova.agi` issue #31 open. Release after full exact-head tests/CI, review without findings, Vercel Preview READY; merge once to main and verify exact Production SHA and rollback.
