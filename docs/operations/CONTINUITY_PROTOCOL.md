# HOCKER — Continuity Protocol

Status: **ACTIVE OPERATING CONTRACT**  
Scope: Hocker One, NOVA and ecosystem-level repository inventory.  
Purpose: recover the exact work state after a lost chat, closed IDE, crashed session, provider outage or handoff without treating conversation memory as the system of record.

## 1. Continuity objective

A new ChatGPT/Codex/engineer session must be able to answer, from durable evidence:

1. What repositories exist now?
2. Which repositories were added, removed, renamed or archived since the previous checkpoint?
3. What are the exact default-branch SHAs?
4. What Hocker One/NOVA PRs are open and at what head SHA?
5. What deployment/runtime evidence exists?
6. What is the current AGI certification/eval evidence state?
7. What decisions were made, what phase/gate changed and what remains open?
8. What was the next intended action when the previous session stopped?

The system must reconstruct facts; it must not rely on a model remembering a prior conversation.

## 2. Layers and responsibilities

### Layer A — GitHub

Durable code/history/PR evidence. The continuity reconciler inventories every repository visible to the HOCKER owner account and stores exact default-branch SHAs. Hocker One and NOVA additionally record open PR heads.

### Layer B — Supabase Context Bridge

Durable append-only normalized checkpoints, coverage and manifests. This is the primary operational continuity ledger.

### Layer C — Vercel / runtime evidence

Hocker One runtime metadata is checkpointed from deployment environment metadata. A configured runtime is not called healthy unless exact deployment evidence exists.

### Layer D — Human/agent handoff

`LAST_KNOWN_STATE.md` preserves the last material intent, decision sequence and next action. It is an emergency/readability layer, not a heartbeat database.

### Layer E — SYNTIA / Memory Mirror

Reviewed reusable knowledge only. Raw chats, secrets and private-domain data never become global continuity memory.

## 3. Automatic reconciliation

`GET /api/context-bridge/reconcile` is an internal fail-closed route. It:

- authenticates with `CRON_SECRET` / `HOCKER_ONE_INTERNAL_TOKEN` using constant-time comparison;
- performs GitHub read-only inventory and exact-head reads;
- detects repo add/remove/rename/archive/head changes by comparing the previous checkpoint cursor;
- records Hocker One/NOVA open PR heads;
- reuses the canonical eight-gate AGI certification implementation for Supabase evidence;
- records Vercel runtime metadata only when the environment actually exposes it;
- writes normalized Context Bridge checkpoints;
- never activates a Context Bridge manifest;
- never performs a GitHub/Vercel/Supabase external material mutation;
- never stores tokens, cookies, raw conversations or secret values.

The Vercel backstop runs once per day because Hobby cron jobs cannot run more frequently. This is a **reconciliation safety net**, not the only update mechanism.

## 4. Immediate checkpoint triggers

A checkpoint must be emitted as soon as practical after any material event:

- repository created, deleted, renamed, archived or restored;
- branch/PR opened, closed, merged or materially rebased;
- approved project phase/gate transition;
- production/preview deployment or rollback;
- database migration or RLS/permission change;
- integration/provider connected, disconnected or reclassified;
- AGI eval/tool-eval evidence changes;
- material blocker discovered/resolved;
- important architecture/canon decision;
- session handoff after meaningful work.

ChatGPT/Codex should use the existing normalized checkpoint route/API when an authorized identity is available. If unavailable, update `LAST_KNOWN_STATE.md` in the working branch and mark `checkpoint_pending=true` in the handoff.

## 5. What is and is not real-time

### Near-real-time for work performed through HOCKER agents

Agents checkpoint immediately at material milestones. No GitHub Action is required.

### Daily reconciliation for out-of-band changes

The cron catches changes performed manually in GitHub or by other tooling and compares them to the last repository snapshot.

### Event-level GitHub lifecycle target

The account `HockerAGI` is a GitHub user account, not an organization. A future GitHub App installation/webhook is the appropriate event source for second-level lifecycle events across repositories. Until that exists, polling plus milestone checkpoints is the supported design.

A repository created and deleted completely between two polls can theoretically escape the daily inventory if no milestone checkpoint/webhook observed it. Do not claim otherwise.

## 6. Recovery procedure after loss of chat/session

1. Read root `AGENTS.md`.
2. Read `docs/operations/LAST_KNOWN_STATE.md`.
3. Read the current Context Bridge active manifest plus latest checkpoints.
4. Query GitHub again; never trust the last snapshot for mutable facts.
5. Query Supabase/Vercel/runtime evidence applicable to the task.
6. Compare observed state against the handoff and identify drift before writing.
7. Resume from the named next action or explicitly supersede it with evidence.

If Context Bridge is temporarily unavailable, GitHub + `LAST_KNOWN_STATE.md` provide a degraded recovery path. If GitHub is unavailable, Supabase checkpoints retain the last observed SHAs/PR/repository inventory. Catastrophic simultaneous permanent loss of all providers requires an independent backup provider and is outside what any single cloud control plane can guarantee.

## 7. Context Bridge manifest lifecycle

Checkpoints update continuously/by milestone. Manifests do not.

Create a new draft manifest when a coherent evidence set is ready for a handoff/release/canon transition. Do not rewrite the active historical manifest.

Activation remains:

`draft -> coverage review -> human Owner session -> MFA AAL2 -> one-time evidence-bound approval -> active`

Scheduled/internal identities are forbidden from activation.

## 8. GitHub Actions economy

- General CI ignores commits whose changed paths are only Markdown.
- Code, tests, configuration, migrations and workflows still trigger CI.
- Android/emulator workflows remain path-scoped/manual and should run once on the frozen final candidate unless a relevant Android path changed.
- Do not use Actions as a periodic heartbeat or repository monitor.

## 9. Phase tracking

A phase is not inferred from prose or a percentage. A phase/gate transition becomes durable only when its checkpoint includes:

- previous phase/gate;
- new phase/gate;
- decision/evidence reference;
- exact repository/PR/SHA where applicable;
- owner/approval reference when required;
- open items for the next phase.

This prevents two chats from silently inventing different phase names.

## 10. Non-goals

This protocol does not authorize:

- direct writes to `main`;
- manifest activation without Owner+AAL2;
- AGI material actions;
- secret replication;
- raw-chat backups;
- production DDL merely to keep a checkpoint fresh;
- modifications to product repositories outside the scope of the active workstream.
