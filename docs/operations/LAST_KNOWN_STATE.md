# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-11-18 (verified GitHub/Vercel snapshot; re-query mutable facts)**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live NOVA Developer E2E evidence and Owner signoff: **https://github.com/HockerAGI/hocker.one/issues/306**.
Historical September handoff: `HANDOFF_2026-09-05-R2.md`; historical August platform closure: `PLATFORM_CLOSURE_2026-08-30.md`.
This recovery card is dated, not an independent production certification.

## Current verified pointers (2026-11-18 release snapshot; re-query before action)

- Hocker One `main=f9b34f77b9b056a99cda31199adfe963060a5a41` and Vercel Production `dpl_4GXPTL9X5GEXjo4H6vShUF3vcJ2t` READY, with `hockerone.vercel.app` assigned to this deployment.
- **MERGED PR #460** (2026-11-18): GitHub App support and disabled independent Cron monitor are deployed as code. Last checked: **0 open PRs** across `hocker.one`, `nova.agi`, `hocker-node-agent`.
- Candidate SHA `0d70e10d3fa61694683480f6b6cb39b1450530bb` completed CI rerun 44263124722 successfully: regressions, TypeScript, lint, build and **mandatory `npm audit --audit-level=high` PASS**; Codex reviewed last SHA with 0 outstanding threads; exact Preview was READY. GHSA-fc5q-39xc-vjpf was officially withdrawn, but no picomatch patch is claimed.
- GitHub App server-side Production credentials have **not** been configured; ChatGPT's connected GitHub App is not the NOVA runtime identity. `VERCEL_TOKEN` remains Preview-only; a declared `AI_GATEWAY_API_KEY` is not itself a live provider certification.
- Core AGI certification baseline: `2026.08.21-8` + `score-v5`, 16/16 profiles, 48/48 evaluations; existing scope evidence only, **not** autonomous developer E2E. Do not repeat.
- Read-only tool assignment baseline: 19/19 verified; no material writes were certified by that contract.
- Global material capability: `allow_actions=false` across all 16 AGIs at last SQL verification. Owner Gate remains required for each applicable material action.
- Cloudflare Cron historical successful observations exist. Independent absence detection is included in `main` but **not enabled** or certified for real alert delivery.
- Supabase was ACTIVE_HEALTHY at release cut; no isolated restore drill is certified and no paid branch was created.
- Historical sources remain preserved for audit; dated September/August documents are archival context, not present-day live provider truth.
- `nova.agi/main`, `hocker-node-agent/main`, provider secrets, migrations, alerts and runtime state are mutable; query them directly.

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

1. **Completed code gate:** PR #460 had mandatory audit and exact-head CI green, Codex/Preview reviewed, merged with SHA check and deployed to Production; do not reopen the retired picomatch advisory as an unresolved gate without new evidence.
2. **Owner identity and readiness:** install/configure a least-privilege GitHub App or approved alternative directly in the Vercel Production secrets manager, separately validate Vercel service credentials; new environment variables require a new deployment. Do not copy tokens from ChatGPT or paste them into issues.
3. **Genuine NOVA/AGI-origin PR:** Owner AAL2, authenticated GitHub repo reads, specialist proposal, Owner Gate, branch/file/PR, CI/Codex, rollback and durable evidence; no artificial AGI actions or permissive global `allow_actions`.
4. **SRE/recovery:** activate and validate independent missed-Cron alert delivery using controlled observation checks, then complete an isolated Supabase database + Storage restore drill with explicit cost authorization before creating billable resources.
5. Physical Node Agent is optional for the serverless scope. Do not claim 24/7 dedicated runtimes or broad voice/browser/tool parity without separate evidence.

## Release rule

Before any material action: verify current main, production deployment, migrations, relevant runtime, existing implementation, PR base/head and exact-head checks. Merge only when mandatory checks are green and mergeable. After a successful main merge, reconcile editable continuity/canonical documentation before treating the milestone as complete.
