# HOCKER — Context & Memory Freshness Policy

Status: **ACTIVE CANDIDATE — PR #216**  
Scope: Context Bridge, recovery context, provider checkpoints, canonical-source freshness and Memory Mirror publication.  
Rule: freshness is an evidence property, not a timestamp decoration.

## 1. Objective

Keep HOCKER operational continuity current enough to survive chat/session loss without turning chat history, credentials or mutable provider data into uncontrolled shared memory.

There are two different systems and they MUST stay different:

- **Context Bridge** = operational continuity and current evidence.
- **Memory Mirror / SYNTIA** = reviewed reusable learning.

A current checkpoint does not automatically make a provider `complete`. Provider coverage must combine checkpoint recency with current **capability evidence**. A fresh provider with only partial or blocked capability evidence remains `partial` or `blocked`.

## 2. Freshness classes

| Surface | Required update mode | Freshness rule | Fail-closed state |
| --- | --- | --- | --- |
| GitHub repository/PR lifecycle | milestone/hito checkpoint immediately after material work; future GitHub App/webhook target for out-of-band events | exact repo/PR/SHA/check evidence | `partial/stale` if event evidence is missing |
| Supabase production/security | milestone checkpoint after migration/security/AGI-evidence changes + direct verification before writes | project ref + migration/advisor/evidence revision | `partial/stale/blocked` |
| Vercel runtime/deployment | milestone checkpoint after preview/production/rollback + daily backstop | deployment ID + exact Git SHA + state/log evidence | `partial/stale/blocked` |
| ChatGPT handoff | normalized checkpoint at material session handoff | decisions, pending work and exact evidence refs only | `stale` until next verified handoff |
| Codex | normalized checkpoint only from an observed Codex workspace/runtime handoff | repo/branch/SHA/tests/evidence | never fabricate freshness |
| Google Drive canon | direct read on material canon changes; target renewable `changes.watch` channel + change-feed reconciliation | file/change revision and classification | `partial/stale` until authoritative set + watch/read evidence exist |
| Memory Mirror | publication only after existing NOVA/SYNTIA/security review | reviewed reusable knowledge, provenance and approval | no automatic operational mirroring |

## 3. Event-driven continuity

Near-real-time means **event/milestone driven**, not continuous polling.

Emit a normalized Context Bridge checkpoint after a material hito such as:

- repository/PR lifecycle change;
- merge, deployment or rollback;
- database migration, RLS/grant/RPC change;
- provider integration/health reclassification;
- AGI eval/tool-eval evidence change;
- architecture/canon decision;
- material blocker resolution/discovery;
- meaningful ChatGPT/Codex handoff.

Do not create noisy heartbeats for unchanged state.

## 4. Vercel daily backstop

The deployed backstop remains:

```text
17 8 * * *
```

That is a once-daily reconciliation safety net, compatible with the current Vercel Hobby scheduling limit. It is NOT the source of near-real-time continuity.

Requirements:

- route remains fail-closed;
- authenticate scheduler/internal requests with `CRON_SECRET` / approved internal identity;
- comparison/writes remain idempotent because cron delivery may overlap or be duplicated;
- never activate a Context Bridge manifest from the cron;
- never perform provider mutations from reconciliation.

## 5. GitHub out-of-band target

The durable target for repository lifecycle events is a scoped **GitHub App/webhook** installation, not a secret-bearing polling script and not an account-wide imaginary webhook.

Until a GitHub App/webhook is deployed and evidenced:

1. agent milestones publish checkpoints immediately;
2. daily reconciliation catches persistent out-of-band drift;
3. a create+delete event occurring entirely between polls may be missed and MUST NOT be claimed as observed.

## 6. Google Drive canon target

Google Drive push notifications are only a change signal; the consumer must read the change feed and checkpoint exact observed revisions. The target adapter uses renewable `changes.watch` channels and renews them before expiry.

Until the authoritative editable canonical set is positively identified and a renewable watch/read path exists:

- `google_drive` coverage stays `partial` or `stale`;
- PDF derivatives do not silently become editable authority;
- a Drive search hit does not mean the canon is current;
- documents containing credentials/secrets are explicitly excluded.

The current 2026-08-16 audit identified HOCKER files in Drive but did not prove one unique editable source set for all August canon. That uncertainty is retained, not hidden.

## 7. Memory Mirror publication

Memory Mirror is **reviewed reusable learning**, not a real-time activity feed.

Allowed:

- distilled reusable facts/lessons with provenance;
- approved knowledge targeted to the appropriate AGI(s);
- items that pass the existing safety and review pipeline.

Forbidden automatic publication:

- chat crudo / raw chat or message history;
- credentials, API keys, cookies, tokens or secret values;
- TOTP/recovery material;
- KYC/PII/private-domain payloads;
- current operational state merely because it is recent;
- provider errors/log blobs without review.

Operational facts belong in Context Bridge checkpoints. They may become Memory Mirror knowledge only through the existing reviewed publication path.

## 8. Manifest lifecycle

Checkpoints can update per milestone. **Manifiestos are immutable evidence snapshots.**

- Never rewrite an active historical manifest to make it look current.
- Build a new `draft` from a coherent evidence set.
- Coverage must be evidence-backed and fail closed.
- Scheduled/internal identities cannot activate.
- Activation requires a real human Owner session with MFA **AAL2** and current one-time evidence-bound approval.

A draft can remain incomplete indefinitely without weakening runtime controls.

## 9. Recovery snapshots

`LAST_KNOWN_STATE.md` is updated after material milestones when it changes the continuation point. It is not a heartbeat log. A new session must still query connected providers before mutating anything.

Context Bridge checkpoints are the append-only operational history; `LAST_KNOWN_STATE.md` is the human-readable emergency resume card.

## 10. Current evidence cut — 2026-08-17 00:18Z

Fresh normalized checkpoints exist for:

- GitHub ecosystem inventory;
- primary Supabase AGI/security state;
- Hocker One Vercel production state;
- current ChatGPT Plan A handoff;
- Google Drive canon audit, deliberately `partial`.

Codex was not refreshed because no current Codex workspace/runtime handoff was directly observed in this evidence cut. Absence of evidence remains explicit.
