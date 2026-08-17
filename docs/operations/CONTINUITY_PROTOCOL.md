# HOCKER — Continuity Protocol

Status: **ACTIVE OPERATING CONTRACT**  
Scope: Hocker One, NOVA and ecosystem-level repository inventory.  
Purpose: recover exact work state after a lost chat, closed IDE, crashed session, provider outage or handoff without treating conversation memory as system of record.  
Freshness rules: `docs/operations/CONTEXT_FRESHNESS_POLICY.md`.

## 1. Continuity objective

A new ChatGPT/Codex/engineer session must answer from durable evidence:

1. What repositories exist now?
2. Which repos were added/removed/renamed/archived since previous checkpoint?
3. What are exact default-branch SHAs and branch-protection states?
4. What Hocker One/NOVA PRs are open and at what heads?
5. What deployment/runtime evidence exists?
6. What is current AGI certification/eval evidence state?
7. What security/provider blockers remain?
8. What decisions changed a phase/gate?
9. What is the next intended action?

The system reconstructs facts; it never relies on a model remembering prior conversation.

## 2. Layers and responsibilities

### Layer A — GitHub

Durable code/history/PR/security evidence. Reconcile all repositories visible to HOCKER with exact default heads. Event-level out-of-band target is a scoped GitHub App/webhook; until then use milestone checkpoints + daily reconciliation.

### Layer B — Supabase Context Bridge

Append-only normalized checkpoints, coverage, manifests and capability evidence. This is the primary operational continuity ledger.

### Layer C — Vercel/runtime

Deployment metadata/log evidence tied to exact Git SHA. Configured is not equivalent to healthy/deployed.

### Layer D — Human/agent handoff

`LAST_KNOWN_STATE.md` preserves material continuation state. It is an emergency/readability layer, not a heartbeat database.

### Layer E — SYNTIA / Memory Mirror

Reviewed reusable knowledge only. Raw chat, secrets, credentials, TOTP/KYC/PII and unreviewed operational events never become global memory automatically.

### Layer F — Canon / Google Drive

Drive canon freshness is evidence-backed. Target adapter is renewable `changes.watch` + change-feed read. A search result or PDF timestamp alone does not prove editable canonical freshness.

## 3. Automatic reconciliation

`GET /api/context-bridge/reconcile` is internal and fail-closed. It:

- authenticates with `CRON_SECRET` / `HOCKER_ONE_INTERNAL_TOKEN` using constant-time comparison;
- performs read-only GitHub inventory/exact-head reads;
- detects persistent repo lifecycle/head drift;
- records Hocker One/NOVA open PR heads;
- reuses the canonical eight-gate AGI certification implementation;
- records Vercel runtime metadata only when environment evidence exists;
- writes normalized checkpoints;
- never activates a manifest;
- never performs GitHub/Vercel/Supabase material external mutation;
- never stores tokens, cookies, raw conversations or secret values.

The Vercel backstop runs `17 8 * * *` once daily. It is a reconciliation safety net, not the near-real-time mechanism.

## 4. Immediate checkpoint triggers

Emit a checkpoint after material events:

- repo created/deleted/renamed/archived/restored;
- branch/PR opened/closed/merged/materially rebased;
- phase/gate transition;
- preview/production deployment or rollback;
- DB migration, RLS/grant/RPC change;
- provider connected/disconnected/reclassified;
- AGI eval/tool-eval evidence change;
- material blocker discovered/resolved;
- architecture/canon decision;
- meaningful ChatGPT/Codex handoff.

ChatGPT/Codex should use the normalized checkpoint API when authorized. If unavailable, update `LAST_KNOWN_STATE.md` in the working branch and mark checkpoint pending. Do not write Git commits as periodic heartbeats.

## 5. What is and is not real-time

### Near-real-time

Milestone/event checkpoints publish immediately after material work performed through HOCKER agents.

### Daily out-of-band reconciliation

The once-daily Vercel cron catches persistent drift performed manually or by other tooling.

### GitHub event target

Use a scoped GitHub App/webhook for repository lifecycle events. Until deployed, a create+delete event entirely between polls can be missed. Do not claim otherwise.

### Google Drive event target

Use renewable `changes.watch` channels and then read the Drive change feed. Channels expire and require renewal. Until a canonical editable source set and renewable adapter are proven, Drive remains `partial/stale` as evidence dictates.

## 6. Recovery procedure

1. Read root `AGENTS.md`.
2. Read `docs/operations/LAST_KNOWN_STATE.md`.
3. Read `docs/operations/CONTEXT_FRESHNESS_POLICY.md`.
4. Read current active manifest plus latest Context Bridge checkpoints.
5. Query GitHub again; never trust snapshot for mutable facts.
6. Query Supabase/Vercel/runtime evidence applicable to the task.
7. Compare observed state against handoff and explicitly identify drift.
8. Resume from named next action or supersede it with evidence.

If Context Bridge is temporarily unavailable, GitHub + `LAST_KNOWN_STATE.md` are the degraded path. If GitHub is unavailable, Supabase checkpoints retain last observed SHAs/PR/inventory. Permanent simultaneous provider loss requires independent backup and is outside any single control plane.

## 7. Manifest lifecycle

Checkpoints update per milestone. Manifests do not.

Create a new draft for a coherent handoff/release/canon transition. Never rewrite an active historical manifest.

Coverage must combine checkpoint recency with current capability evidence. Freshness alone is insufficient.

Activation remains:

`draft -> evidence-backed coverage review -> human Owner -> MFA AAL2 -> one-time approval -> active`

Scheduled/internal identities are forbidden from activation.

## 8. Memory lifecycle

Context Bridge operational facts do not automatically flow into Memory Mirror. Only distilled, reusable, non-sensitive knowledge that passes existing NOVA/SYNTIA/security review may be published. This prevents a real-time context feed from becoming uncontrolled long-term memory.

## 9. GitHub Actions economy

- General CI ignores Markdown-only commits.
- Code/tests/config/migrations/workflows trigger CI.
- Android/emulator workflows remain path-scoped/manual and run on frozen candidate unless relevant Android paths changed.
- Do not use Actions as periodic heartbeat/monitor.

## 10. Phase tracking

A gate transition is durable only when checkpoint contains:

- previous gate;
- new gate;
- decision/evidence reference;
- exact repo/PR/SHA;
- owner/approval ref when required;
- next open items.

## 11. Current Plan A evidence cut

As of `2026-08-17T00:18:00Z`, fresh normalized checkpoints exist for GitHub ecosystem, primary Supabase AGI/security evidence, Hocker One Vercel production, current ChatGPT handoff and Google Drive audit (`partial`). Codex was intentionally not refreshed without direct current workspace/runtime evidence.

PR #216 is the isolated implementation workstream. Production authority remains Hocker One `main` `945ed9cdeda909faa9823230d2a4f47ff84173c7` until an explicitly gated merge/deployment changes it.

## 12. Non-goals

This protocol does not authorize:

- direct writes to `main`;
- manifest activation without human Owner+AAL2;
- AGI material actions;
- secret replication;
- raw-chat backups;
- production DDL merely to keep checkpoints fresh;
- product-repo mutations outside active workstream scope;
- fabricated freshness for Codex, Drive or any provider lacking current evidence.
