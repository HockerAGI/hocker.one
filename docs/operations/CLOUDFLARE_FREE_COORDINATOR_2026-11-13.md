# HOCKER NOVA — Cloudflare Free Coordinator (observe-only foundation)
Version: 2026-11-13 | Scope: `HockerAGI/hocker.one`

## Intent and provider consolidation

Single Cloudflare Worker + Cron (already-connected Cloudflare account), existing Hocker One control plane on Vercel, existing Supabase project and existing model router. No new third-party services, additional AGIs, Queues, KV, R2, Workers AI calls, database tables, or Supabase migrations in phase 0.

The project canon assigns **all cloud material actions to Hocker One Owner Gate** and requires idempotency, retry policy, evidence, and rollback before autonomous writes. A scheduled Worker is not a persistent Node.js/physical runtime. Do not mark `nova-runtime-1` or `hocker-node-1` alive based on Cron success.

## Deployment state / costs

- `infra/cloudflare/nova-coordinator/wrangler.toml` starts with `NOVA_COORDINATOR_ENABLED=false` and **no Cron triggers**. A deployed script is inert until both environments are explicitly enabled.
- Cloudflare Workers Free currently documents 100,000 requests/day, 10 ms CPU for requests and Cron, 5 Cron triggers/account, 128 MB memory, and up to 50 subrequests. Check your **actual** account subscription/spending limit, not only publicly documented quotas. At audit, Cloudflare subscription/billing reads returned HTTP 403 and no Worker scripts or Pages projects existed. Never promise zero billing from an inaccessible plan.
- When the account is confirmed Workers Free, one Cron `*/5 * * * *` equals **288 scheduled invocations/day**, excluding retries/manual runs. Observe CPU/requests against limits. Never enable a Paid fallback or postpaid Gateway route.
- No deployment, DNS zone or secret is created by this PR.

## Security — one new least-privilege shared credential, not reused infrastructure keys

- **Vercel server-side only:** `NOVA_COORDINATOR_READ_TOKEN` (random 32+ characters, set as Sensitive/Encrypted, Preview first); `NOVA_COORDINATOR_OBSERVE_ENABLED=true` only after approval.
- **Cloudflare Worker secret binding:** same `NOVA_COORDINATOR_READ_TOKEN` in Worker secrets, not in `[vars]`, code, GitHub, chat, logs or browser; `NOVA_COORDINATOR_ENABLED=true` after its official free-plan and Preview checks.
- **Never reuse** `CRON_SECRET`, `HOCKER_ONE_INTERNAL_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` or LLM API keys: these have broader permissions.
- The Worker calls exactly `GET https://hockerone.vercel.app/api/internal/nova-coordinator`, disallows redirects and checks the JSON schema, payload size and timeout.
- The Hocker endpoint is OFF by default, checks a separate Bearer token in constant time and reads only aggregate counts via Supabase. No prompt contents, PII, task bodies, keys or tool inputs leave Hocker One.
- The publicly reachable Worker responds only at `GET /health` with minimal static health. That does not mean the schedule or dedicated fallback is running.

## Verification and rollout gates

1. Review PR: regression tests, typecheck, lint, Next build and dependency audit PASS; automated security code review with no unresolved findings; Vercel Preview exact SHA READY.
2. Confirm Cloudflare Workers plan is Free in the **actual account dashboard** (API subscriptions/billing returned 403 on this connection). Record plan evidence; do not create any billing subscription.
3. Create the separate scoped token in protected Vercel **Preview** and Cloudflare Worker secrets. Never put it in the chat, repo or plain project variables. No secrets exist in the initial code.
4. Use a non-production Hocker One Preview origin for the first true E2E by setting a pinned origin through a **reviewed Preview-only** configuration; do not test against production before approval.
5. Verify missing/invalid token is rejected; successful request shows counts and no execution, inference or database mutation; check Vercel and Cloudflare logs using only safe codes/metrics.
6. Only after production approval, enable the dedicated observe token in production, configure a single Cron trigger and observe at least three scheduled successful samples with zero write/inference metrics. Do not automatically retry failures at high frequency.
7. Stage 1 task execution **requires a separate PR and explicit authorizations**. Use existing Supabase atomic/leased task claim; preserve run accounting, costs caps, Owner Gate, idempotency and rollback. Never call the existing `/api/orchestrator/cron` or `/api/orchestrator/run` endpoints from this read-only Worker: those can execute queued commands.

## Acceptance matrix

| Claim | Evidence required |
|---|---|
| Worker deployed | Cloudflare script/deployment ID + free plan, no charge |
| Scheduled coordination | Cron event logs + authenticated read-only status for 3 runs |
| NOVA serverless tasks live | separately authorized safe task claim and real run trace, no paid fallback |
| Dedicated 24/7 runtime live | actual host and `/health/ready`, fresh worker tick/heartbeat, rollback |
| All 16 AGIs autonomous | separately audited per-AGI scopes/permissions, tool E2E, limits and Owner Gate |

This stage does not certify the last three claims.

Sources:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- HOCKER Canon DOC-05 (2026-08), DOC-06 (2026-08), Hocker One #306.
