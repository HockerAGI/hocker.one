# NOVA zero-credit serverless observer (phase 1)

Real, read-only operational observation using Hocker One and existing Supabase. This is not an inference engine, a replacement AGI runtime, independent failover or synthetic worker.

## Existing resources only
- Existing protected Hocker One service and Supabase production.
- Existing Vercel cron /api/context-bridge/reconcile at 08:17 UTC daily. No second cron, no pg_cron migration.
- Existing Owner/Admin/Operator/Viewer session for GET /api/nova/zero-credit/status.
- Existing AGI agents, tasks, learning mirror, run records, usage logs, node heartbeats and Owner approval history.

## Strict behavior
- Select-only with bounded result size and errors reported separately from the existing continuity reconciliation.
- No model calls, no external writes, no RPC worker claim, no task recovery, no memory publication, no Owner actions.
- Stale 14 old queue items need manual triage before they can be considered for work; never replay automatically.
- Historical mirror or certification evidence is not proof of live model or failover.
- A successful observer response means the read operation succeeded, not that NOVA is answering or self-learning.

## Release gates
Require exact-head CI, security and Vercel Preview READY before protected merge. Verify post-merge GitHub main and Vercel production exact SHA, and compare authenticated endpoint result with fresh Supabase read-only SQL. Only the next real cron invocation can attest scheduled operation.

## Separate future phases
1. Memory learning proposals based on verified evidence, deduplicated and gated by NOVA, SYNTIA, VERTX and JURIX, with Owner approval for publication.
2. Genuine inference on available local hardware or an explicitly authorized provider. Optional Ollama-only mode exists in nova.agi and is off by default.
3. Authenticated live Owner AAL2 gate for real material actions, with evidence and rollback; never redo passed historical 16/16 AGI certification without a version change.
4. Mirror disaster recovery cannot be considered independently available when both replicas depend on one Supabase production project.
