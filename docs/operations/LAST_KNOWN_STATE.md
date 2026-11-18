# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-11-18 (verified GitHub/Vercel snapshot; re-query mutable facts)**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live NOVA Developer E2E evidence and Owner signoff: **https://github.com/HockerAGI/hocker.one/issues/306**.
Historical September handoff: `HANDOFF_2026-09-05-R2.md`; historical August platform closure: `PLATFORM_CLOSURE_2026-08-30.md`.
This recovery card is dated, not an independent production certification.

## Current verified pointers (2026-11-18 snapshot; re-query before action)

- Hocker One `main=f187257873f44e3b8053cc3308471cefa1c8e9ee` and Vercel Production `dpl_AcCdDXzD3AdWEHfYjrPf6z74Cvop` READY.
- PR #460 is the single OPEN PR across `hocker.one`, `nova.agi` and `hocker-node-agent` at evidence cut; it stages GitHub App identity, Owner-gated engineering, and a disabled independent Cron monitor. Read live HEAD rather than assuming a dated commit remains current.
- Candidate regressions, TypeScript, lint, build and exact-SHA Preview have been verified on successive revisions; **mandatory `npm audit` still fails with 19 high `picomatch` findings, GHSA-fc5q-39xc-vjpf**. No merge or Production deployment is authorized.
- Historical AGI scope: 16/16 profiles, 48/48 evaluations, 19/19 read-only tool assignments. Do not repeat to certify autonomous development.
- Supabase recent evidence: global material privileges absent and no active material queue; re-query before asserting current status.
- Cloudflare Cron has logged real scheduled successful observations; this is NOT an AGI coding runtime. Independent absence detection is staged but not activated.
- `nova.agi/main`, `hocker-node-agent/main`, Vercel variables, Supabase migrations and incidents are mutable: query them directly.

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

## Remaining NOVA Developer release gates (scope-aware)

1. Official `picomatch` remediation and full candidate CI green; exact-head Codex/Preview, reviewed merge, verified Production.
2. One consolidated Owner final session for minimum server identities, AAL2 and task-scoped approvals; real external Cron alert delivery.
3. One genuine NOVA/AGI-origin PR: authenticated repository inspection, reversible code change, Owner Gate, CI/Codex and controlled deploy.
4. Independent missed-Cron notification and isolated Supabase restore drill with evidence; costs approved before new branch.
5. Physical Node Agent is optional for serverless scope. Do not claim full 24/7 dedicated runtimes or broad voice/browser/tool parity without separate evidence.

## Release rule

Before any material action: verify current main, production deployment, migrations, relevant runtime, existing implementation, PR base/head and exact-head checks. Merge only when mandatory checks are green and mergeable. After a successful main merge, reconcile editable continuity/canonical documentation before treating the milestone as complete.
