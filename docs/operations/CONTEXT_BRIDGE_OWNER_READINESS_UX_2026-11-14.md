# Context Bridge Owner AAL2 — current vs historical provider readiness

Date: 2026-11-14 (America/Tijuana). Scoped to `HockerAGI/hocker.one`, no cross-repository changes.

## Verified defect: historical green badges can mislead Owner

The Owner supplied five real Android screenshots showing:
- `Más → Continuidad` is reachable with the official Hocker ONE isotype and mobile `Apps` dock label;
- the saved **2026-08-08** manifest `98b2ed4e-103d-4c8f-8681-7df5549ca507` is accurately marked **Histórico · verificar**, no `approval_id`;
- a list of six historical `COMPLETE` badges; these are **stored snapshot statuses**, not the present-day provider checkpoints;
- a POST form prefilled with `max_staleness_hours=168` and **Crear y activar con MFA**.

Independent read-only Supabase evidence at the same date:
- The live `context_bridge_checkpoints` + `context_bridge_capabilities` derive for the six providers is exactly **2/6 current**: **GitHub** and **Supabase** have recent checkpoints and verified capabilities; **ChatGPT, Codex, Google Drive and Vercel** are **stale**. Several older `context_bridge_sources.last_checkpoint_at` timestamps disagree with actual checkpoint table, so the UI must use the authoritative checkpoint rows and capability `last_verified_at` rather than only source metadata.
- Old 6/6 snapshot rows in `context_bridge_coverage` were verified in August, not November. The active manifest has `owner_approved=true` without an actual linked Owner approval row. There are **0** rows in `owner_gate_approvals`.
- Vercel Production was READY at exact `hocker.one/main=1aa9d6d675dc6f9cbcceecfcf4b80d6da43daa0d` before this PR. No permission/DB writes or new provider contracts were approved.

## UX improvement and safety boundary

- Keep the historic manifest and evidence accessible, but collapse its six archived badges by default to eliminate misleading green priority and excessive vertical scroll.
- Immediately above activation fields, render a **read-only** current evidence panel with each provider's last real checkpoint timestamp and a status derived through the existing `deriveProviderCoverageStatus` pure function, honoring the selected age threshold.
- Use a server-side Owner+AAL2-gated read of only `source_id,provider,observed_at,status,last_verified_at`, scoped by `project_id`; disclose only sanitized provider names, dates and coverage statuses. Do not retrieve raw transcript, secrets, messages or payloads.
- Disable `Crear y activar con MFA` when current coverage is not exactly 6/6, or when data cannot be read. Explain why and offer a page refresh after real checkpoint ingestion.
- Preserve the existing POST route as the **authoritative** check: fresh AAL2, provider capability verification, `record_owner_gate_approval` and one-time `activate_context_bridge_manifest_v2`. A client preflight is never authorization; do not bypass the server or relax the 168-hour threshold simply to approve old records.
- This PR **does not** create checkpoints, connect ChatGPT/Codex/Drive, alter six-provider rules, mark sources verified, change Owner approval history, or trigger activation.

## Remaining operational work after this UI release

An authorized recorder must create real, sanitized, verifiable checkpoints and fresh verified capabilities for ChatGPT, Codex, Google Drive and Vercel, respecting each source's contract. Then re-evaluate all six from the actual Owner page. Only then may the Owner intentionally approve and activate the new manifest from a current AAL2 session. A green result does not certify the autonomous AGI runtime or physical Node Agent.

Acceptance: exact-head CI + Preview READY, review without findings, main-only production auto deploy, mobile authenticated Owner screenshot showing 2/6 or updated live count; no fabricated checkpoint rows or Owner approvals. Preserve rollback to pre-PR deployment.
