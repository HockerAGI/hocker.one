# NOVA real free-readonly canary — Owner AAL2 gated (2026-11-15)

Existing infrastructure: Hocker One in Vercel Hobby, Supabase Free, existing Cloudflare Workers AI adapter and gateway `hocker-agi`. No new host, Cron, API token, gateway, task dispatcher or paid model.

## Gates and implementation

- New POST `/api/agi/free-pilot`: authenticated Owner role and current Supabase MFA AAL2. Requires `confirm=true` and exact project. Inoperative unless new feature flag AGI_FREE_READONLY_PILOT_ENABLED=true **and** all existing `cloudflareFreeRouteConfigured()` predicates are verified in Production.
- No retries and no generic queue claim. New SQL function `start_free_readonly_agi_pilot_v1`, executable only by service_role, atomically creates one NOVA `working` analysis task and matching `running` run per UTC day; requires 16 agents, all `allow_actions=false`, zero queued/pending, no stale backlog, and real Owner membership. A live Supabase counts snapshot is created in the same transaction; audit event also atomic. It never requeues 14 canceled historical tasks.
- Inference uses **directly** the existing `cloudflareWorkersAiProvider.complete`, fixed Cloudflare Free model `@cf/zai-org/glm-4.7-flash`, 384 output tokens max, 20s timeout, no native tools, no web search, no dynamic/paid model, no fallback. Only the plain live counts are sent; no owner identity, credentials or raw contexts.
- Existing atomic completion `complete_serverless_agi_execution` persists model output/evidence with hash; any provider error marks task/run as failed, never retries automatically. Model completion is not falsely labeled full 16 AGI autonomy, full Context Bridge or dedicated Linux runtime.
- UI `/workers` adds an explicit confirmation control and real readiness/status; it never automatically executes on load.

## Do not activate prematurely

At audit, the necessary Cloudflare Workers AI production flags and secret were present in **Preview only**, NOT in the first 100 production environment entries returned by Vercel. Account subscription Billing Read scope could not be verified through the connected Cloudflare token; gateway AI billing mode was `postpaid` with spend limits not configured. Owner reports Workers Free and official docs confirm GLM-4.7-Flash eligibility on Workers Free with 10,000 free Neurons/day, but that is NOT sufficient proof of zero cost in this account. Leave AGI_FREE_READONLY_PILOT_ENABLED unset and do not promote credentials or trigger inference until current account/billing/Free restrictions are confirmed and exact-head CI plus deployment gates passed.

Even when this pilot eventually succeeds, it remains an explicit human-triggered single NOVA run. Autonomous scheduled AGI execution, other 15 AGI scopes, material writes, system tool calls, isolated claims and durable resource quotas require separate authorization and verification. Never reuse read-only NOVA_COORDINATOR_READ_TOKEN to claim tasks.