# HOCKER — Canon / implementation alignment 2026-08-19

Status: **ACTIVE DELTA REGISTER**

This document records drift between approved human publications and later connected evidence. It does **not** rewrite history. Older PDFs remain evidence for their own cut; implementation/configuration and `main` outrank them for present-tense technical state.

Detailed operational handoff: `HANDOFF_2026-08-19.md`.

## 1. Canonical facts preserved

- Product catalog: 10 apps.
- AGI catalog: 16 AGIs.
- Hocker One remains the governed control plane / Owner Gate.
- Material actions are not authorized from chat by default.
- Evidence-first, deny-by-default, least privilege and safe failure remain binding.
- GitHub editable sources + executable evidence precede derived PDF/DOCX publication.

## 2. Material drift requiring next canonical publication

### DOC-00 — governance/document control

Update next source release to distinguish **9 connected engineering repositories** from the 10-app catalog. Include the one-source/no-duplication recovery model used by `HANDOFF_2026-08-19.md`. Do not encode mutable SHAs as permanent canon.

### DOC-05 — architecture/platform

The 2026-08-05 publication described five repos and an older NOVA topology. Current engineering evidence requires the next edition to state:

- 9 connected repos are engineering inventory, not product count;
- Hocker One unified NOVA runtime/control plane is primary;
- `nova.agi` is dedicated compatibility/fallback until independently re-certified;
- Node liveness uses actual heartbeat freshness, not command/event activity;
- current AGI certification is evidence-driven and AAL2-gated;
- provider limitations/rate limits are explicit operational states, not application failures.

### DOC-06 — AGI engineering

Next edition should codify:

- exact 16-ID canonical validation;
- `allow_actions=false` as guarded baseline;
- resumable runtime/tool evaluation that skips current evidence;
- read-only `supabase` / `github` probes and AI Gateway coverage via runtime eval contract;
- partial evidence snapshot => fail closed;
- Owner TOTP challenge/verify => AAL2 ceremony, without duplicate enrollment;
- durable `agi_runs` + `agi_feedback` as certification evidence;
- approval/resume/idempotency/timeout tests as mandatory for future agent frameworks.

### DOC-07 — security/privacy/continuity

Next edition should incorporate:

- current Supabase Advisor exception register instead of treating every discoverability warning as the same severity;
- provider-plan limitations recorded explicitly, never painted green;
- current Node Mirror liveness rule;
- no synthetic AAL2/eval evidence;
- exact-candidate deployment evidence requirement;
- CI/FinOps distinction between public standard GitHub-hosted runners and private-repo quota;
- current MCP security stance: metadata/annotations never replace actual policy/Owner Gate.

## 3. MCP reference drift

DOC-07 currently cites MCP `2025-11-25`. Official MCP maintainers released specification `2026-07-28`; the official TypeScript SDK v2 is the stable line implementing it. The new revision is materially different (including a stateless transport/lifecycle model), so **do not perform a blind citation replacement or dependency upgrade**.

Required future action: compatibility inventory → ADR → adapter plan → contract/conformance tests → preview → rollback. Until then the existing Hocker runtime contract remains authoritative.

## 4. External engineering references reviewed

- GitHub Actions billing/runners: public standard GitHub-hosted runners are free; private repos consume included minutes; larger runners are billed.
- Vercel Limits / Project Settings / Build troubleshooting: account rate limits, redeploy and ignored-build controls should inform release mechanics.
- Supabase MFA: `aal1`/`aal2`, TOTP challenge + verify and SSR step-up behavior align with PR #230.
- `openai/openai-agents-js`: RunState/HITL/approval lifecycle is a benchmark for resumable governed operations, not a migration mandate.
- `modelcontextprotocol/typescript-sdk`: v2 / 2026-07-28 is a future compatibility target requiring ADR.
- `vercel/ai`: recent approval/resume issues reinforce explicit regression tests before adopting alternate primitives.

## 5. Publication rule

Do not regenerate DOC-00/05/06/07 PDFs from improvised text. First identify the approved editable source pipeline and reviewers, update source(s), run documentary validation and produce a versioned release package. Until then this delta register + executable evidence are the present-tense technical reconciliation layer.
