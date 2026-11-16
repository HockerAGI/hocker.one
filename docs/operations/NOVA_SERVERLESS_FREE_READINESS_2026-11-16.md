# NOVA · Serverless Free-only readiness contract (2026-11-16)

## Purpose
Use the existing Cloudflare coordinator and Supabase to inspect Free-only prerequisites without a VPS, new Worker, new Cron or new credentials. This is **Owner-review eligibility**, not authorization to run models automatically.

## Evidence and restrictions
Five historic Free-only inference runs (including NOVA-to-HOSTIA parent-child) remain certified and must never be replayed as canaries.
The existing Cloudflare hocker-nova-coordinator Cron is every five minutes and currently only observes Hocker One. The read token is NOT a dispatch token.
GET /api/internal/nova-coordinator remains a fixed-origin, Bearer-protected, count-only API and adds serverless_free_preflight v1.
The preflight reads current agi_agents, including the count allow_actions=true, queued/pending tasks, pending material-action queue and existing stale-backlog gate. Any incomplete database read returns 503.
Owner-review candidate is true only with exactly 16 registered agents, no material grants, clear tasks/actions/backlog and the existing fixed Free-only provider configuration.
Cloudflare Workers AI Free operator attestation is not live API billing confirmation: billing_api_verified is always false.
automatic_dispatch=false; model_requests_per_tick=0; task_claims_per_tick=0; owner_authorization_required=true; dedicated_runtime=false.
The Cloudflare Worker rejects a missing, altered or contradictory contract and only logs the safe booleans and counts; no task content, secret or model output.

## Release order
1. Merge Hocker One PR only after exact-SHA CI, regression, TypeScript, lint, build, dependency audit, CodeQL and final review all pass.
2. Confirm Vercel Preview READY before merge and exact-SHA Production READY after merge.
3. Only then update the **existing** Cloudflare hocker-nova-coordinator Worker source, preserving secret_text/plain_text bindings, and keeping its Cron schedule unchanged. Never deploy the dormant event-preflight Worker as a second cron.
4. Confirm at least three genuine successive Cloudflare Cron observations after source update with serverless_free_preflight valid, model_calls=0 and task_claims=0. If cannot verify, do not mark production readiness certified.

## Later dispatch gate (separate approval and code review)
Actual Free-only execution will need a separate scoped dispatch authority, explicit Owner-approved task IDs, atomic once-only claims, a daily quota/budget and kill switch, exact model/provider identity, audit hashes and rollback.
Do not expand the read token's scope; do not enable AGI_DELEGATION_DISPATCH_ENABLED, paid provider router, general run_once, allow_actions globally, or arbitrary MCP tools.

## Physical node
hocker-node-agent remains optional for local process/terminal work. Its PR #42 is independently under review and does not gate serverless observations.