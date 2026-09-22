# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-09-21**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live operational source: `docs/operations/HANDOFF_2026-09-05-R2.md`.
Current production-readiness gate: `docs/operations/PLATFORM_CLOSURE_2026-08-30.md`.
Historical sources remain preserved for audit and are not live pointers.

## Current verified pointers

- Hocker One `main`: `b9df00dc7f74c3c4dec3c6c5778cab959a6d2fbe`.
- Hocker One production: `dpl_6NFU9DKVh1GQSj5XoihkoE8dex3D` — READY on the exact main SHA.
- Supabase production migration head: `20260918081119`.
- Core AGI historical certification baseline: `2026.08.21-8` + `score-v5`, 16/16, 48/48; **must be rerun for current certification**.
- Tool certification baseline: 19/19 read-only PASS; no external writes.
- All 16 AGIs remain `allow_actions=false`.
- `nova.agi/main`: `093d5e52ac9b4e8fafba535ae46b2ff0e3bcfded`.
- `hocker-node-agent/main`: `4ef039b9410dfe524092e2ef12a2b7a72f07e699`.
- `hocker.agi/main`: `ef3a9fe222f72d71e009f9d9cc746bf7bad9ca03`.
- `chido.casino/main`: `c780d2b18b9d18921147a99367c025791134064c`.

## Certification decision

**Do not start a new certification by manually creating rows or copying August evidence.**

The executable certifier already has the correct contract:
- suite `2026.08.21-8`;
- scorer `score-v5`;
- sequential, resumable execution;
- only missing targets are executed;
- real Owner AAL2 required;
- no synthetic evaluation evidence accepted.

## Runtime freshness

- Node heartbeat last seen: **2026-04-21 22:15 UTC**.
- AGI integration checks last checked: **2026-08-10 06:17 UTC**.
- Active runtime tokens: **0**.
- Owner Gate approvals: **0**.
- Hocker One production reported no runtime errors in the available 7-day query, but Vercel runtime-log retention did not provide a full 7-day raw log window.

## Remaining human/provider gates

- Owner AAL1/AAL2 negative-path + containment.
- Context Bridge AAL2 activation ceremony.
- Supabase leaked-password protection (provider-plan dependent).
- Android API 36 on final main if required.
- Dedicated NOVA fallback runtime provisioning/verification.
- Current Node Agent heartbeat.
- Isolated restore/RPO/RTO.
- Cloudflare provider-side configuration only if applicable.
- PUNTO·G classification/decision.

## Release rule

Never declare `production_ready` from this card alone. Re-query mutable facts and require a single final evidence package bound to the actual release SHA/configuration.
