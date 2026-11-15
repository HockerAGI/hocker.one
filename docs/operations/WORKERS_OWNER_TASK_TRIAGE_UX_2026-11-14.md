# Hocker One · Workers Owner triage, actual counts and mobile readability

Date: 2026-11-14 America/Tijuana.
Scope only `HockerAGI/hocker.one`. User provided nine real Android screenshots, 20:25–20:28 local, of `/workers` in production SHA `1f51fa1d660ce8041ad1b6f43c47bbeb92c55d63`.

## Screenshot audit

- "Esquema: Preparado" is **only DB schema availability**, not dedicated AGI readiness.
- "En cola: 0" and "Completadas: 60" derive from `GET /api/agi/workers`'s **last 60 activity rows**, not project-wide counts. This hides 14 old jobs (13 queued, 1 pending), while the banner correctly shows 14 via an independent count.
- Uncollapsed model result `AGI eval revia.evidence` expands multiple screens with literal Markdown markers; the nested 720px-scroller, tall five stat cards and fixed mobile dock make navigation unnecessarily difficult.
- The "Procesar siguiente" button still looks prominent even when blocked. Creating a new task doesn't actually execute one and was presented as a primary operation above review.
- Real screenshot of REVIA refusing fabrication or irreversible client actions is not a malfunction: a *completed evaluation* can correctly refuse an adversarial request. Do not invert it into a model failure.

## Verified Supabase read-only state before change

- Project `hocker-one`: 178 completed, 37 failed, **13 queued + 1 pending**, 16 AGIs registered, 0 `allow_actions=true`, 0 fresh nodes and 0 Owner approvals.
- Stale task sample: pending `TEST FRONTEND CONNECTION` on 2026-06-24; 13 analysis/draft-only scheduler pulses on 2026-08-03. All old tasks are `requires_approval=false`; **one Candy task had 2 attempts**, so no blanket cancellation or automatic replay is justified.
- Context Bridge last verified provider coverage remains **2/6** (GitHub, Supabase); ChatGPT, Codex, Google Drive, Vercel checkpoints are older than seven days. This reflects **checkpoint freshness**, not general service connectivity.
- `nova.agi` dedicated / `hocker-node-agent` runtime has no recent accredited server heartbeat. No host access demonstrated and no deploy attempted.
- Three project repos had 0 open PRs before this scoped change.

## Implemented

1. **Truthful counters.** Authenticated API loads project-wide counts with `select id (head,count exact)` for queued/pending/working/completed/failed. If count fails, show `—`, never 0. Separate capped 60 activity rows from counters.
2. **Review inventory.** Independent newest? No: chronological oldest-first review query for queued/pending tasks older than 24h, project-filtered, capped at 100 with explicit truncation. Only safe metadata; no payloads, raw prompts, or secrets. Shows 14 historical entries even though 60 recent items are completed evaluations.
3. **One-by-one Owner cancel.** No auto-clean. Explicit reason (12–400 chars), confirmation, Owner role and server-side MFA AAL2. Versioned RPC `owner_cancel_stale_agi_task_v1` service-role only uses transaction row lock and checks project, status, age, no active lock, `draft_only`, `analysis`, no approval requirement. Updates only `status=canceled,error,updated_at`; retains input/payload/evidence and existing runs. Inserts `events` audit in the **same transaction**. A failed audit rolls back cancellation. No bulk button.
4. **Mobile UI.** Compact PageShell, 2×2 metrics, three actual gates with links to Review/Continuity/Nodes, shortened non-technical blocked state, default-collapsed task form, six initially rendered recent results with progressive reveal, full text and technical metadata only in accessible disclosures, simple bold rendering with escaped React nodes.
5. **Operational gates.** GET performs *read-only* current six-source capability/checkpoint assessment (same shared coverage helper) and checks `nodes.last_seen_at` in the last five minutes. Neither is a claim of autonomous runtime readiness. Unavailable reads display "Sin verificar".
6. CI tests lock in counts, read-only inventory, real authorization, atomic audit, no deletion or fake evidence, navigation and compact UI.

## Release protocol and pending closure

- Apply **versioned migration only after complete CI/code review and Preview exact-head READY** and security advisor review; migration deployment must precede merger because new route calls this RPC. SQL does not modify any task until Owner explicitly cancels.
- Merge only after all checks green. Production via automatic `main` deploy, verify exact SHA/alias and runtime error aggregates; do not manually duplicate.
- Real end-to-end cancellation requires an actual Owner session with MFA AAL2; do not pretend to have it. Until then all 14 tasks remain intact and block worker claims.
- Context Bridge four old providers require **authentic source-backed checkpoint ingestion** before 6/6 and separate Owner activation. This PR only visualizes existing read-only evidence.
- Runtime still needs actual host authorized access, persistent real heartbeats, budget gates, verification and rollback; adding GUI status does not start Docker or Workers AI.
- Preserve `hocker.one #306` and `nova.agi #31` open until these operational gates close.
