# HOCKER ONE / 16 AGIs — estimated delivery readiness, 2026-11-16

> **NON-CANONICAL, EVIDENCE-BASED PROJECT ESTIMATE**, not a production
> certification percentage, not a duration estimate and not a count of
> closed issues. Reconcile against the Canonical HOCKER 2026.08 docs, then
> always prefer **live production** over planning documents. Do not
> advertise the system as "100% complete", "24/7" or autonomous without
> end-to-end evidence. No additional inference was requested for this review.

## Current production baseline

- GitHub `HockerAGI/hocker.one/main=e88f95647bc63096c5bc2a3d7b001d34c5a9ab92`;
  Vercel Production `dpl_9wPUqxMM5HXF67VidPtQhgwta9Ea` READY
  and exact `hockerone.vercel.app` alias; postmerge checks 5/5 SUCCESS.
- Supabase project `yvuibbcuntqpyqiuqggd`: 16 agents, no
  `agi_agents.allow_actions=true`, no active/reserved inventory
  tasks and no inventory runs (2026-11-16 snapshot).
- Five bounded prior Free-only model inferences, including a completed
  NOVA→HOSTIA linked parent/child result. **Do not replay.**
- 16/16 latest current-scope AGI certification feedback, with 48 linked
  successful evidence runs, was verified separately in Hocker One #306.
  This is a narrow offline/test contract, **not** 16 persistent AGI
  inference runtimes.
- Cloudflare existing `hocker-nova-coordinator`: 5 bindings, one
  scheduled Cron `*/5 * * * *`, fixed no-model Owner-approved
  inventory route. The secret values are not available via Cloudflare
  metadata, so their equality and an authenticated no-work HTTP tick
  are **not yet independently verified**.
- 0 fresh dedicated nodes in the recent Supabase node query. Issue #306
  remains OPEN. Node-agent PR #42 is still open. No irreversible
  autonomous merges, writes or paid fallback are enabled.

## HOCKER ONE score: 80 / 100 — 20 points remain

| Capability gate | Weight | Estimated earned | Why |
| --- | ---: | ---: | --- |
| Product CI + Vercel exact-SHA release | 20 | 20 | main CI, production READY and alias match |
| Shared Supabase DB, migrations, RLS baseline | 20 | 18 | canonical versioned SQL/roles; full isolated replay and some provider security checks remain |
| UX/Owner consoles, catalogs, tasks, workers | 15 | 12 | UI and endpoints exist; full mobile E2E and usability signoff remain |
| AAL2, Owner Gate, least privilege & queue controls | 20 | 16 | MFA/protocol implemented; final material-action approval/reject/recovery ceremony remains |
| GitHub/Vercel/Supabase/Cloudflare integrations | 15 | 10 | connected; real Cron→Vercel authenticated inventory still not proven |
| Observability, reliability, rollback/continuity | 10 | 4 | build/evidence available; scheduled liveness, alerting and restored-state drills remain |
| **Total** | **100** | **80** | **Not release-complete** |

## NOVA + all 16 AGIs score: 55 / 100 — 45 points remain

| Capability gate | Weight | Estimated earned | Why |
| --- | ---: | ---: | --- |
| Registry, memory, contracts and current-scope evaluations | 25 | 25 | 16/16 agent profiles + 48/48 historical eval case evidence |
| Real Free-only reasoning and scoped delegation | 15 | 10 | 5 prior bounded inferences, NOVA→HOSTIA; not all 16 live |
| MCP/read-only tools, routing, auth/policy contracts | 20 | 12 | certified read-only assignments, tool policy; limited live independent provider proof |
| Repeated scheduled work, queues, agent handoffs | 20 | 5 | real once-only canaries and Cron code; no verified continuous AGI dispatcher |
| Create, modify, test and PR existing/new apps | 15 | 1 | goal requires autonomous agent-created reviewed PR, tests, approved merge and rollback; not certified |
| Live runtime SRE, budgets, heartbeats, failover | 5 | 2 | controlled no-paid-fallback, no confirmed persistent node/SLO |
| **Total** | **100** | **55** | **Not autonomous deployment-complete** |

**Combined estimate = 67.5%, rounded to 68%**, equal weight for
HOCKER ONE and the 16-AGI platform. This is a transparent engineering
readiness rubric, **not a scientifically measured percentage**; weights
and earned partial scores are judgment calls and must be updated with
acceptance evidence, never with optimistic release labels.

## Remaining release gates, in order

1. **No-work Cron proof**: at least one Cloudflare five-minute tick
   reaching the fixed Vercel internal inventory endpoint with valid
   Bearer and a persisted/sanitized authenticated log. Expect
   `processed=false`, HTTP 200, no model/tools/claims. If unavailable,
   diagnose with exact safe status; do not manufacture traces or
   trigger a synthetic approval.
2. **Owner live MFA AAL2**: Owner authorizes one count-only task in
   `/workers`, as current production authenticated user; obtain real
   task/run/SHA/audit and rollback/revoke evidence. No tokens/TOTP in chat.
3. **NOVA→AGI→MCP→approved action**: release-scoped tools and action
   contract, strict authorization, idempotency, preflight and rollback
   with approved non-destructive operation. Keep global allow_actions
   false and reject unrestricted autonomous writes.
4. **Actual AGI software development**: from authorized user request,
   safely edit an existing repo or create a new application, prepare
   tests, open a PR, pass CI and Codex, request Owner approval and
   merge/deploy only under the established release gate. Record
   provenance for each subprocess, provider and cost.
5. **Live reliable service**: heartbeat/readiness for relevant
   runtimes, incidents/alerts, budget circuit-breakers, tool tenancy,
   recovery/rollback and operator handoff for all 16 AGIs. Optional
   dedicated Linux node is separate and not a prerequisite for the
   serverless no-model gate.
6. **Manual final signoff**: close Hocker ONE #306 only after the
   actual Owner ceremony and all release-security acceptance evidence.
   A passed eval or a READY Vercel deployment is not sufficient.

## Telemetry addition (current PR)

Authenticated internal Vercel endpoints will emit only structured
`nova_coordinator_authenticated_observation` and
`nova_free_inventory_authenticated_tick` events, including safe
booleans/aggregate counts and `model_requests=0`; no raw URLs,
cookies, headers, API secrets, prompts, TOTP or task bodies. These logs
are future **measurement points**, not evidence that a scheduled
event already occurred. Do not claim Cron E2E until real production
events are retrieved.

Source of truth: [Hocker ONE issue #306](https://github.com/HockerAGI/hocker.one/issues/306),
production GitHub checks, live Vercel deployment and Cloudflare Worker,
Supabase SQL read-only snapshots. The August 2026 canonical engineering
manual (DOC-06) explicitly requires integration, E2E, chaos/security,
cost and Owner Gate; archival documents are not current runtime evidence.
