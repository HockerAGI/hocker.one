# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-09-13 16:41 UTC-07:00**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live operational source: `docs/operations/HANDOFF_2026-09-05.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `0994e6df5cba44c2929605a21f01eac595a721d5`.
- Latest merged product milestone: Operating Loop v1 — first contracts slice; PR #368 merged as `0994e6df5cba44c2929605a21f01eac595a721d5`.
- Unified NOVA streaming: PR #365 merged as `2ab17d56468ba47ca980f138b3679bcc99367f30`.
- Core AGI certification baseline: `2026.08.21-8` + `score-v5`, **16/16 AGIs, 48/48 PASS**; durable baseline, not fresh liveness evidence.
- Tool certification baseline: **19/19 read-only PASS**; no external writes during certification.
- All 16 AGIs remain `allow_actions=false` unless current evidence explicitly proves otherwise.
- `nova.agi/main`: re-query before mutation.
- `hocker-node-agent/main`: re-query before mutation.
- Supabase production: re-query project and migration head before mutation.

## Recent completed maintenance

- Canonical NOVA History workspace promoted.
- Native MCP Tool Fabric promoted.
- Automatic AGI routing promoted.
- Governed Dynamic MCP provider fabric promoted.
- Bounded IA↔IA delegation and SYNTIA learning propagation promoted.
- Unified NOVA streaming promoted; dedicated `nova.agi` remains compatibility fallback unless independently certified.
- Operating Loop v1 contract slice promoted: Work Session states/transitions, ResearchRecord, ExecutionCandidate, ApprovalEnvelope, WorkSessionEnvelope and deterministic candidate hashing.

## Current architectural posture

- NOVA remains the orchestrator; AGIs remain specialized identities.
- Capability/Tool routing must use the canonical Hocker Fabric; do not create a second registry, memory store, action queue or runtime router.
- Native tools are model-facing contracts; Hocker One remains the execution/policy/evidence boundary.
- Dynamic MCP providers require governed manifests, HTTPS host allowlisting and existing execution policy.
- IA↔IA delegation uses the canonical task/run path with parent lineage and bounded depth/fan-out.
- SYNTIA learning uses the existing Learning Extractor/Memory Mirror path.
- Streaming chat must enter the unified Hocker runtime before the dedicated compatibility fallback.
- Operating Loop is an orchestration envelope over existing stores and controls; it must not duplicate them.

## Still incomplete or not fully evidenced

- Work Session persistence/store, executable Research Gate wrapper, deterministic Candidate builder and scoped Approval Envelope execution are planned next slices; only the first contracts slice is currently implemented.
- NovaWorkspace full decomposition and UX consolidation is partial.
- Full file/artifact/voice/tool/connector UX is not certified complete.
- Browser/computer-use and terminal/code-execution capability parity is not yet implemented as a certified Hocker-native surface.
- Deep Research beyond provider-native web grounding remains partial.
- Fresh 16/16 AGI runtime certification is not evidenced by current activity.
- Dedicated `nova.agi` physical runtime certification is not evidenced.
- Node Agent physical heartbeat is not evidenced.
- Owner AAL1/AAL2 human ceremony/negative-path evidence remains external.
- Backup/restore and measured RPO/RTO drill remain incomplete.
- Supabase leaked-password protection remains an external/provider-plan gate.

## Current operational freshness

Do not represent registry presence as liveness. Re-query `agi_runs`, integration checks and node signals before claiming current AGI/runtime availability.

## Operating Loop v1

- Design/specification exists in PR #367: `docs/superpowers/specs/2026-09-10-hocker-operating-loop-v1-design.md`.
- PR #368 implemented only the contract slice and was validated on exact HEAD with Vercel READY/GitHub SUCCESS before merge.
- The next slice must start from current `main` and first verify whether any store/research/approval implementation already exists.

## Recovery rule

Before any material action, re-query GitHub, Vercel, Supabase and the relevant provider. Code/configuration/evidence outrank historical narrative.
