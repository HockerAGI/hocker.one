# HOCKER — Canon / implementation alignment 2026-08-19

Status: **ACTIVE DELTA REGISTER**

This register records present-tense drift without rewriting the 2026-08-05 canonical publications. Production/configuration and `main` outrank those publications for current technical state.

Current handoff: `HANDOFF_2026-08-19.md`.

## Canonical facts preserved

- 10 apps; 16 canonical AGIs.
- Hocker One = governed control plane / Owner Gate.
- Material actions are not authorized from chat by default.
- Evidence-first, deny-by-default, least privilege and safe failure remain binding.
- Editable GitHub sources + executable evidence precede derived PDF/DOCX publication.

## Current implementation delta

PR #230 is now merged and production READY. The next canonical publication should incorporate, without mutable SHAs as permanent doctrine:

### DOC-00

- distinguish 9 connected engineering repositories from 10 product apps;
- use one active handoff/recovery authority instead of duplicated mutable snapshots;
- preserve history separately from current recovery pointers.

### DOC-05

- Hocker One unified NOVA runtime/control plane is primary;
- `nova.agi` is dedicated fallback/compatibility until independently re-certified;
- Node liveness derives from heartbeat freshness, not command/event activity;
- AGI certification is evidence-driven + Owner AAL2 gated;
- provider quota/plan limits are explicit operational states, not application failures.

### DOC-06

- exact 16-ID canonical validation;
- `allow_actions=false` guarded baseline;
- resumable runtime/tool eval that executes only pending evidence;
- read-only `supabase` / `github` probes; AI Gateway covered by runtime eval contract;
- partial evidence snapshot => fail closed;
- existing TOTP challenge/verify => AAL2; no duplicate enrollment by default;
- durable `agi_runs` + `agi_feedback` => certification evidence;
- future agent approval/resume must test approve/reject/retry/idempotency/timeout/abort/replay.

### DOC-07

- Supabase Advisor exception register and explicit provider-plan limitations;
- exact-candidate Preview/production evidence requirements;
- Node heartbeat liveness;
- no synthetic AAL2/eval evidence;
- public-vs-private GitHub Actions FinOps distinction;
- MCP metadata/annotations never replace policy/Owner Gate.

## MCP drift

The existing canon cites MCP `2025-11-25`; current official work reviewed for this cut uses spec `2026-07-28` / TypeScript SDK v2. The transport/lifecycle delta is material. Required future path: compatibility inventory → ADR → adapter/conformance tests → Preview → rollback. No blind dependency/citation replacement.

## External engineering references retained

Detailed notes live in `HANDOFF_2026-08-19-PRE230.md`; current decisions remain:

- GitHub Actions billing/runners: protect private-repo minutes; public standard runners are not the same billing constraint.
- Vercel limits/redeploy/build evidence: provider quota != code failure.
- Supabase MFA: real AAL2 via existing TOTP challenge/verify.
- `openai/openai-agents-js`: resumable HITL/RunState as benchmark, not migration mandate.
- `modelcontextprotocol/typescript-sdk`: v2/2026-07-28 as compatibility research target.
- `vercel/ai`: approval/resume edge cases require regression testing before adoption.

## Publication rule

Do not regenerate DOC-00/05/06/07 PDFs from improvised text. First identify the approved editable-source pipeline and reviewers, update source, validate the documentary package and publish a versioned derivative. Until then this delta register + executable evidence are the current reconciliation layer.
