# NOVA phase 2 — deterministic learning signals, no external LLM

This phase **reuses** the existing SYNTIA memory proposal/write gate, reviewer UI and owner-gated publication. No replacement memory system, no new database schema or scheduler.

## Provenance and safety
- Authorized caller: the existing CRON_SECRET-protected Hocker One continuity cron, once a day at 08:17 UTC. No public proposal endpoint is created.
- Scan up to 49 real `agi_runs` marked `failed` with `finished_at` within 24h; abort proposal generation if more than 48 records exist rather than claiming a complete sample.
- Only canonical AGIs, valid run/task UUIDs and worker identities `hocker-one-unified:` or `hocker-one-serverless:` qualify. Ignore missing, stale, future-dated or unknown failures.
- Fixed-prefix allowlist maps failures to static low-claim descriptions. No raw error, customer content, prompt, secret, task payload or provider response is persisted in learning proposals.
- Require at least two distinct failed task IDs for the same AGI and failure class. Max four categories evaluated and at most two new pending proposals per cron execution.
- Stable project/AGI/category/version source SHA-256, prefilter both active mirror and live proposals BEFORE applying the batch cap, and reuse the existing SYNTIA unique partial index for concurrency-safe dedupe. Previously-live categories do not starve newly detected categories.
- A valid proposal remains `pending_review` and is not published to memory or update feed. Existing SYNTIA review UI and final Owner AAL2 gate govern all publication.
- The submit action only stores a review candidate and an audit record; no material tool, worker, LLM inference, model training, new permissions or deployment is performed by this pipeline.
- `NOVA_DETERMINISTIC_LEARNING_ENABLED=false` disables the new triage without disabling the existing continuity cron.

## Acceptance and limits
- Existing Sept 2026 AGI certification remains valid for its suite. This pipeline does not recertify or replay legacy queued jobs.
- No recent real worker failures means the cron correctly creates **zero** learning proposals; it is not proof that a model is healthy or that autonomous learning improved quality.
- Freshness window may skip data if cron is delayed, or if more than two genuinely new categories occur on one day; the response explicitly reports deferred counts. This bounded behavior is intentional to avoid unreviewed high-volume memory writes or accidental old-task backfill.
- An AGI failure category is evidence of observed symptoms, **not a root-cause finding**. No change in system prompts, tool permissions, models, source code or owner authorization results from a proposal.
- Verify exact-head full CI and Vercel Preview READY before merge. After merge verify exact production SHA and GitHub CI; then validate the next actual authorized cron run with persisted pending review rows and SYNTIA review decision history.
- A real local LLM/device and independent failover remain separate missing capabilities; no free always-on GPU is claimed.
