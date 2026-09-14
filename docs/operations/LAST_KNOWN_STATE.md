# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-09-13 16:41 UTC-07:00**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live operational source: `docs/operations/HANDOFF_2026-09-05-R2.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `0994e6df5cba44c2929605a21f01eac595a721d5`.
- Latest merged milestone: Operating Loop v1 contract slice, PR #368.
- Prior unified NOVA streaming milestone: PR #365 -> `2ab17d56468ba47ca980f138b3679bcc99367f30`.
- Core AGI certification baseline: `2026.08.21-8` + `score-v5`, 16/16 AGIs, 48/48 PASS; durable baseline only.
- Tool certification baseline: 19/19 read-only PASS; no external writes.
- All 16 AGIs remain `allow_actions=false` unless current evidence proves otherwise.
- `nova.agi/main`: re-query before mutation.
- `hocker-node-agent/main`: re-query before mutation.
- Supabase production project: re-query before mutation.

## Current architecture

- NOVA is the primary orchestrator/control plane.
- Canonical capability routing selects specialist AGIs internally; ordinary users do not manually select AGI/model/provider/tool.
- Native MCP tools are model-facing contracts; Hocker One is execution/policy/evidence boundary.
- Dynamic MCP providers reuse the canonical registry and require HTTPS host allowlisting.
- IA↔IA delegation reuses canonical tasks/runs with parent lineage and bounded depth/fan-out.
- SYNTIA learning reuses the existing Learning Extractor/Memory Mirror path.
- Streaming NOVA routes through unified Hocker runtime before dedicated compatibility fallback.
- Operating Loop contracts wrap existing state/task/run/action/evidence/Owner Gate systems rather than creating parallel authorities.

## Operating Loop v1

Design/specification: PR #367, `docs/superpowers/specs/2026-09-10-hocker-operating-loop-v1-design.md`.

Implemented in PR #368:
- WorkSessionState + transition validation.
- ResearchRecord provenance contract.
- ExecutionCandidate exact-state contract.
- ApprovalEnvelope binding contract.
- WorkSessionEnvelope references.
- Deterministic canonical JSON + SHA-256 candidate hashing.

Not yet implemented by this slice:
- Work Session persistence wrapper.
- Executable Research Gate wrapper.
- Candidate builder.
- Scoped Owner AAL2 approval execution envelope.
- Resumable orchestration runner/UX consolidation.

## Current operational freshness

Registry presence is not liveness. Re-query `agi_runs`, integration checks and node signals before current AGI/runtime claims.

## Remaining hard gates

- Fresh 16/16 AGI runtime certification.
- Dedicated `nova.agi` physical runtime certification.
- Node Agent physical heartbeat.
- Owner AAL1/AAL2 ceremony and negative-path evidence.
- Backup/restore and measured RPO/RTO.
- Full files/artifacts/voice/browser/code-execution parity.
- Supabase leaked-password protection provider-plan gate.

## Release rule

Before any material action: verify current main, production deployment, migrations, relevant runtime, existing implementation, PR base/head and exact-head checks. Merge only when mandatory checks are green and mergeable. After a successful main merge, reconcile editable continuity/canonical documentation before treating the milestone as complete.
