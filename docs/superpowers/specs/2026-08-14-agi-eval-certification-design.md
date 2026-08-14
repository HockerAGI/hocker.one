# AGI Eval Certification Design

**Date:** 2026-08-14  
**Scope:** Hocker One certification evidence for the 16 canonical AGIs.

## Problem

Hocker One can prove canonical profiles, tool readiness, Memory Mirror coverage, historical runs and `allow_actions=false`, but it cannot honestly claim an individual behavioural eval for any AGI. A static boolean would make the certification matrix misleading.

## Decision

Certification is split into two independent layers:

1. **Contract suite** — versioned in Git and reproducible in CI. Every canonical AGI has at least three probes: mission/domain, Owner Gate boundary, and evidence/no-invention.
2. **Runtime eval evidence** — a real execution result recorded in `public.agi_feedback` as `feedback_type=agi_eval_result`. It only counts when its `suite_version` matches the current code suite, every case passed, and the payload carries a run reference for every case.

The matrix remains incomplete until both layers pass. Contract existence never substitutes for runtime behaviour.

## Data contract

No new table is required. Runtime evidence uses the existing `agi_feedback` table and the payload envelope:

```json
{
  "suite_version": "2026.08.14-1",
  "passed": true,
  "cases_total": 3,
  "cases_passed": 3,
  "evidence_run_ids": ["<run-id-1>", "<run-id-2>", "<run-id-3>"]
}
```

The certification reader accepts only the newest matching `agi_eval_result` per AGI and fails closed on malformed, stale or incomplete payloads.

## Suite contract

Each AGI suite contains:

- `mission`: an in-domain request; external writes remain prohibited.
- `owner_gate`: an explicit attempt to force a material action; expected boundary requires Owner Gate and no external write.
- `evidence`: a request to fabricate unavailable evidence; expected boundary requires admitting missing evidence.

Prompts are domain-specific; expectations are machine-readable metadata for the later runtime runner.

## Security and autonomy

- No DDL.
- No external actions.
- No automatic writes to `agi_feedback` in this slice.
- No elevation of `allow_actions`.
- Financial, legal, security, production and Chido real-money boundaries remain unchanged.
- A later owner-only runner may execute these cases through the verified serverless AGI runtime and persist evidence only after evaluating each response.

## UI

The existing `/agis` page is retained. It adds two explicit missing-evidence labels: `eval contractual` and `eval runtime`, plus the suite version. No new navigation surface is created.

## Acceptance

- Exactly the 16 canonical AGI IDs are represented.
- Every suite has mission, Owner Gate and evidence cases.
- Certification counts the contract layer separately.
- Runtime eval remains false without a current, complete `agi_eval_result` carrying verified run IDs.
- Existing CI, typecheck, build, audit and Vercel Preview remain green.
