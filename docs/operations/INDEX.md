# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

`docs/operations/` keeps one current owner per operating purpose. Historical dated documents retain audit value but must not compete with current authority.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Detailed cross-session continuity | `HANDOFF_2026-08-19.md` | Read first for process, errors already found, exact next step and external research. Do not duplicate it elsewhere. |
| Emergency recovery card | `LAST_KNOWN_STATE.md` | Compact mutable pointers + next move. Requery before action. |
| Current Core release gate | `PLATFORM_CLOSURE_2026-08-19.md` | Fail-closed checklist for PR #230 → Preview → merge → AAL2 → 16/16 evidence. |
| Canon/document drift | `DOC_ALIGNMENT_2026-08-19.md` | Current delta between approved publications and connected implementation. |
| Context Bridge architecture | `CONTEXT_BRIDGE_V1.md` | Shared context architecture/security contract. |
| Context freshness | `CONTEXT_FRESHNESS_POLICY.md` | Checkpoint/manifest freshness semantics. |
| Continuity protocol | `CONTINUITY_PROTOCOL.md` | Durable recovery/checkpoint procedure. |
| Development history | `../00-governance/HOCKER_DEVELOPMENT_LEDGER.md` | Cross-repo milestones/history; do not copy full current handoff into Ledger. |
| GitHub Owner Gate | `GITHUB_OWNER_GATE.md` | GitHub action/approval boundary where applicable. |

## Authority rules

1. Production/configuration + DB/logs > `main`/migrations > executable contracts/tests > approved ADR/policies > canon > historical narrative.
2. A dated Preview is evidence only for its source SHA/tree. Never reuse it for a newer candidate without an explicit equivalence policy approved for that release.
3. Current state belongs in the handoff/recovery sources above; historical documents remain immutable evidence for their cut.
4. Do not create a new Markdown file when an existing current owner covers the same purpose.
5. Do not use Git commits as polling/heartbeat. Batch documentary reconciliation into one commit when possible.
6. Never delete migration/security/release evidence merely to simplify the tree.

## New-session startup

`AGENTS.md` → this index → `HANDOFF_2026-08-19.md` → `LAST_KNOWN_STATE.md` → `PLATFORM_CLOSURE_2026-08-19.md` → `DOC_ALIGNMENT_2026-08-19.md` → requery GitHub/Vercel/Supabase.

Older `PLATFORM_CLOSURE_*`, `DOC_ALIGNMENT_*` and recovery snapshots are historical unless this index points to them as current.
