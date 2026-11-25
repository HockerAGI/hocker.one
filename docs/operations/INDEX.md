# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

`docs/operations/` maintains one current source per operational purpose. Dated documents remain historical evidence unless this index marks them current.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Current NOVA Developer E2E continuity | [GitHub issue #306](https://github.com/HockerAGI/hocker.one/issues/306) | Active mutable evidence for Hocker One, NOVA and the scoped repos; re-query exact PR HEAD, CI and Production. |
| Historical September handoff | `HANDOFF_2026-09-05-R2.md` | Archival baseline, **not** present-day production or engineering readiness. |
| Emergency recovery card | `LAST_KNOWN_STATE.md` | Compact pointers only; re-query mutable facts before action. |
| NOVA Developer launch acceptance | [GitHub issue #306](https://github.com/HockerAGI/hocker.one/issues/306) + exact candidate CI/Codex/Preview/Production | Never close without real Owner Gate AGI-origin PR, security gate and recovery evidence. |
| Historical general platform closure | `PLATFORM_CLOSURE_2026-08-30.md` | Prior scope; preserve the August baseline, not current live status. |
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

`AGENTS.md` → this index → **GitHub issue #306** (current E2E) → `LAST_KNOWN_STATE.md` (dated pointers) → applicable canon/policies → re-query GitHub, Vercel, Supabase and Cloudflare. Historical September/August handoffs are references only.

## Current milestone

See [#474](https://github.com/HockerAGI/hocker.one/pull/474), [#306](https://github.com/HockerAGI/hocker.one/issues/306) and the 2026-11-25 handoff in `LAST_KNOWN_STATE.md`. Re-query exact candidate and production before any action. The following 18 November snapshot is historical, not current provider status.

At the verified 2026-11-18 release cut, Hocker One `main=f9b34f77b9b056a99cda31199adfe963060a5a41` is Vercel Production `dpl_4GXPTL9X5GEXjo4H6vShUF3vcJ2t` READY; `hockerone.vercel.app` points to that deployment. **MERGED PR #460** introduced GitHub App identity for NOVA Developer and a disabled-by-default independent Cron absence monitor. Exact-head CI was rerun successfully (regressions, TypeScript, lint, build and mandatory `npm audit --audit-level=high`); Codex had no major findings and 0 open review threads, with Preview READY. GHSA-fc5q-39xc-vjpf was withdrawn on 2026-11-18; this does **not** mean picomatch was patched.

**Historical next gate at 18 November:** configure Owner-controlled, least-privilege GitHub App credentials for the Production runtime and Vercel authorization after a new deployment incorporating those env changes; perform AAL2 Owner readiness plus a genuine NOVA/AGI-origin PR under Owner Gate. The GitHub connector used by ChatGPT is a separate identity. GitHub runtime credentials are currently absent in Production; `VERCEL_TOKEN` is Preview-only. Independent Cron alert delivery and isolated Supabase restore remain uncertified. Retain 16/16 AGI, 48/48 evaluation and 19/19 read-tool evidence without rerunning or inferring broad autonomy. Follow live #306 for changing state.

Older handoffs and closure snapshots remain historical evidence.
