# NOVA / Cloudflare: event-driven preflight, no execution yet

Date: 2026-11-14 America/Tijuana. Owner scope: hocker.one, nova.agi, hocker-node-agent only.

## Verified prior state

- Hocker One main and Vercel production: 2f990c1357d357d4c52206cf2294159b7cf28bb9; NOVA main cb8d1a1effad80339df7a3cd921532d3bfad59c0; Node Agent main c48cc275f7053e9d4238eb2c3e7a1382fabea76b.
- 14/14 old queued/pending tasks actually canceled individually by Owner in real Supabase, 14 audit events, no leftover backlog; 178 completed / 37 failed.
- Cloudflare account Hocker AGI has an existing hocker-nova-coordinator Worker with *one* Cron every 5m, authenticated observe-only GET, with real successful observations. This remains untouched.
- The Owner does not have OCI/Hetzner or other long-running VM. Cloudflare Worker isolates cannot host the existing always-running Fastify/Docker process unchanged. No synthetic node heartbeat is permitted.
- Cloudflare plan/billing and enforced $0 cost controls are not confirmed; do not infer Free from "standard" usage model.

## Deliverable of this candidate PR

A **separate, OFF-by-default Cloudflare Worker** (nova-event-preflight) makes one bounded authenticated POST per optional Cron event to a **separate Hocker One internal endpoint**. The endpoint verifies a strict fixed preflight contract, checks project-scoped old backlog and current queued/actions counts, and reports whether a Cloudflare-only free route is configured. This creates a safe event-driven adapter without moving Fastify, expanding permissions, executing inference, or touching existing coordinator behavior.

- Separate fixed-origin token NOVA_EVENT_PREFLIGHT_TOKEN (new secret, 32-256 characters; never reuse the coordinator observation token, model keys, Supabase service role, or CRON_SECRET).
- Separate Vercel deployment-protection automation bypass NOVA_EVENT_VERCEL_BYPASS_TOKEN, which is high sensitivity; do not put in GitHub or log it. Can use an existing *provider-issued* bypass credential on this project, but it remains a Worker secret, never public.
- Hocker One NOVA_EVENT_PREFLIGHT_ENABLED must be explicitly true in a reviewed Preview. Worker NOVA_EVENT_PREFLIGHT_ENABLED must be explicitly true. Repo wrangler.toml defaults false and contains **no scheduled trigger**.
- Route is POST-only; body <= 512 bytes, response <= 3072 bytes; fixed project, contract version and preflight-only mode. No body echo, redirects, task contents, raw error detail, or secrets.
- The contract *always* returns task_executor=false, dedicated_runtime=false, ready_for_dispatch=false, zero claims / model requests / material actions, Owner Gate never bypassed.
- No production secrets, deployment, database DDL/DML, paid services, AGI inference, or workers automatically enabled by this PR.

## Release and future activation gates

1. Exact PR head: all Hocker One tests, build, lint, typecheck, dependency audit, CodeQL, independent code review without unresolved findings, Vercel Preview READY.
2. Confirm Cloudflare Workers plan and hard spending cap directly in account; if it cannot be confirmed, **do not deploy or turn on the new Cron**.
3. Authorize, set independent secrets in protected Vercel Preview and Cloudflare new Worker; validate POST missing/bad tokens => 401, malformed/execute requests => 400, enabled=false => 404.
4. One authorized actual Preview preflight: verifies status 200, zero actions/inference, no secrets leaked and exact candidate SHA. Then authorize same-domain prod and one bounded Cron; check at least 3 independent event samples with no errors.
5. **Separate execution PR**: require canonical safe task type, atomic/least-privilege claim, project+AGI allowlist, task-level Owner action gate, free-only model with verified plan + hard cost quota and paid-fallback disabled, idempotency/retries, model/tool E2E and rollback. Do not use existing permissive runtime token to bypass the Owner Gate. No task claim from this PR.
6. Keep nova.agi and hocker-node-agent issues open until their dedicated readiness claims are truly satisfied or the architecture specification is explicitly revised for event-only services. Do not label a Cron as a persistent Linux node.

## Why this phase is separate

The current runUnifiedAgiWorkerOnce can claim a generic queued task and use configured model routes; simply calling it from Cloudflare would risk unreviewed work or paid model fallback. The Cloudflare Workers AI free-only adapter prohibits native tool calls and does not prove a current plan or distributed zero-spend quota. An execution PR must enforce these boundaries before the first claim, not rely on a flag or a green task counter.
