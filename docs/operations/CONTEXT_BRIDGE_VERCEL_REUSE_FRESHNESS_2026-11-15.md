# Context Bridge — existing Vercel REST token and authentic freshness (2026-11-15)

Scope: HOCKER ONE only. NOVA and Node Agent remain unchanged dependencies.

## Verified root cause
The installed public.record_context_bridge_checkpoint(jsonb) RPC de-duplicates on (project_id, source_id, external_ref, source_revision, content_hash) without changing observed_at on an unchanged hash. The source last_checkpoint_at can appear recent while the historical checkpoint observed_at remains expired. Never count the source timestamp as current evidence.
The previous Vercel reconciler read only self-reported process.env.VERCEL_*; production persisted all-null metadata and partial capability. The server-side VERCEL_TOKEN and VERCEL_TEAM_ID already exist, and the project already has a read-only listVercelDeployments adapter.

## Targeted correction
GitHub and Supabase collectors explicitly include observed_at from new genuine provider reads so each daily observation has a distinct authenticated checkpoint. Keep all historical rows.
Vercel calls the existing REST adapter for the existing project, selects the latest production deployment (not an older READY fallback), requires READY, a verified HockerAGI deployment hostname, commit reference main, an exact SHA, and independently checks current GitHub main via the pre-existing GitHub API helper. Missing token, API denial, malformed response, build-in-progress or SHA mismatch => partial capability and non-ready coverage.
No new token, bypass, paid host, SQL DDL/DML or external write. The existing Hobby-safe daily 08:17Z Vercel Cron is unchanged. Context Bridge 6/6 activation remains owner-gated AAL2. The four stale sources are not fabricated.

## Evidence required before calling the Vercel provider complete
Exact-head CI + CodeQL + Preview READY; postmerge main checks all success and production READY; actual authenticated reconciliation triggered via existing authorized Cron/route, persisted new Vercel checkpoint observed_at after deploy with verified capability and exact production SHA.
No re-run of historical 16/16 AGI certification, 14 previously canceled tasks, or Cloudflare coordinator's already-certified Cron contract.
Review #427 follow-up: Codex P2 identified that the existing listVercelDeployments read returned only the first 20 unfiltered Preview/production deployments. The existing adapter now accepts target=production and the reconciler sets it. No new endpoint or token. Verify in CI and review before merge.
