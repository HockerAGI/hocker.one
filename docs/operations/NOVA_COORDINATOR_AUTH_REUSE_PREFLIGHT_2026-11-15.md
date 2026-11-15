# NOVA authenticated coordinator: consolidate preflight on the existing Worker

Date: 2026-11-15 (UTC). Scope: Hocker One, NOVA, Node Agent only.

## Pre-existing evidence and contract
- Live Cloudflare Worker `hocker-nova-coordinator` has an existing, tested read-only token and Vercel Protection Bypass configured as **secret_text** bindings. Do not generate a new bypass, rotate credentials, export secrets or repeat the Owner ceremony.
- The Worker has one Cron `*/5 * * * *`, and verified Cloudflare logs showed 24 HTTP 200 observations and 24 successful scheduled runs over two hours on the previous implementation.
- The previously added Worker `hocker-nova-event-preflight` is intentionally disabled, has no Cron and no secrets. Its independent endpoint is inactive. This release consolidates preflight into the existing GET and avoids invoking the dormant path.

## New preflight (read-only; not task execution)
- GET `/api/internal/nova-coordinator` keeps its existing Bearer token and Vercel bypass contract, with same fixed project and GET method.
- A **fail-closed** count-only read via `inspectAgiBacklog('hocker-one')` checks both `queued` and `pending` tasks older than 24 hours. If the read is unavailable or partial, the existing coordinator endpoint responds 503 rather than claiming a clear queue.
- The response contains an `event_preflight` object with `contract_version=1`, checked=true, stale count, blocked consistency, `ready_for_dispatch=false`, `task_executor=false`, `dedicated_runtime=false`; existing observation metrics and the fields `model_requests=0`, `material_actions_executed=0`, `owner_gate_bypassed=false` are preserved.
- Cloudflare `observe()` validates all new fields and refuses missing/contradictory responses. It returns bounded numeric/boolean fields only to logs. No task payloads, secrets, prompt text, new model inference, database write, or heartbeat.
- This is **not** the worker claim policy, not a 24/7 Linux process, and not a certification of 16 autonomous AGIs.

## Release requirements
1. Exact PR HEAD CI tests, lint, typecheck, build, full dependency audit, CodeQL and code review all successful, with no unresolved review findings.
2. Exact SHA Vercel Preview READY; then PR squash merge to main and verify post-merge main CI and Vercel Production READY on the exact SHA.
3. Only after successful Hocker One production can the Cloudflare coordinator source be updated. Use the Cloudflare Script Upload API metadata `keep_bindings=['secret_text', 'plain_text']` to preserve its existing secret bindings in-place (never read or send the secret values). Verify all three binding names/types, coordinator enabled, existing Cron unchanged, and the new deployment version. If any check fails, stop and restore the previous code/version.
4. Verify at least three real successive Cloudflare Cron events from logs where scheduled outcome is OK, fetch is HTTP 200, and `event_preflight_verified=true`. Recheck Supabase queue counts; do not infer readiness from model connectivity.
5. Keep `hocker-nova-event-preflight` OFF (no Cron) until it can be explicitly retired after comprehensive inventory. Do not auto-delete for this change.

## Separate gates
- Context Bridge 6/6 genuine checkpoints and Owner MFA approval are unrelated to this preflight; not bypassed here.
- For executing actual AGI tasks under Workers Free, a separate carefully reviewed implementation must have a narrow atomic task-claim whitelist, idempotency, cost/Neuron safeguards, constrained tool access and Owner Gate. `runUnifiedAgiWorkerOnce` must not be pointed directly at a public or scheduled Cloudflare endpoint.
