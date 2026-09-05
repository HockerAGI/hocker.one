# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

`docs/operations/` maintains one current source per operational purpose. Dated documents remain historical evidence unless this index marks them current.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Detailed cross-session continuity | `HANDOFF_2026-09-05-R2.md` | Source for current state, closed incidents, evidence and next gate. |
| Emergency recovery card | `LAST_KNOWN_STATE.md` | Compact pointers only; re-query mutable facts before action. |
| Current production-readiness closure | `PLATFORM_CLOSURE_2026-08-30.md` | Single gate for post-Core-certification `production_ready`. |
| Core AGI certification evidence | GitHub issue `#303` + Supabase durable evidence | Completed scope certificate; do not reopen unless evidence/contracts change materially. |
| Canon/document drift | `DOC_ALIGNMENT_2026-08-19.md` | Historical alignment reference until a newer reconciliation is created. |
| Context Bridge architecture | `CONTEXT_BRIDGE_V1.md` | Shared context architecture/security contract. |
| Context freshness | `CONTEXT_FRESHNESS_POLICY.md` | Checkpoint/manifest freshness semantics. |
| Continuity protocol | `CONTINUITY_PROTOCOL.md` | Durable recovery/checkpoint procedure. |
| Development history | `../00-governance/HOCKER_DEVELOPMENT_LEDGER.md` | Append-only history; mutable pointers are re-queried, not compacted destructively. |
| GitHub Owner Gate | `GITHUB_OWNER_GATE.md` | GitHub action/approval boundary where applicable. |

## Authority rules

1. Production/configuration + DB/logs > `main`/migrations > executable contracts/tests > approved ADR/policies > current canon > historical narrative.
2. A Preview proves only its exact source SHA/tree.
3. Current state belongs to the active handoff/recovery/closure; the Ledger preserves history.
4. Do not create another current Markdown source for the same purpose.
5. Do not use commits as polling/heartbeat.
6. Never delete migration/security/release evidence to simplify the tree.
7. Apply the HOCKER four-filter rescue rule before keeping, adapting, merging or discarding any element.

## New-session startup

`AGENTS.md` → this index → `HANDOFF_2026-09-03.md` → `LAST_KNOWN_STATE.md` → `PLATFORM_CLOSURE_2026-08-30.md` → `DOC_ALIGNMENT_2026-08-19.md` → re-query GitHub/Vercel/Supabase/providers.

Older `HANDOFF_2026-08-19.md`, `PLATFORM_CLOSURE_2026-08-19.md` and snapshots remain historical.
