# Hocker ONE — Owner approvals mobile visual verification and spacing correction

Date: 2026-11-14, America/Tijuana. Scope: `hocker.one` owner-only mobile interface and its shared navigation label; no infrastructure, data or action-authority changes.

## Observed evidence

The Owner provided a genuine Android mobile screenshot at 17:47 (local device time) of the actual `hockerone.vercel.app` **Aprobaciones** page. The screenshot directly demonstrates the official blue H isotype in the Topbar, `Trabajo → Aprobaciones` secondary navigation and persistent bottom dock. This image is an Owner-reported visual observation, **not** a browser automation session or proof that any action was approved.

At 17:49, the available platform controls independently reported:
- GitHub `hocker.one/main` = `40987b7d1ad2cf77cb6f520ea177c9a41a3d7916`; Vercel latest Production `dpl_4fFymhurPpjty3AYTgHqobAj3v5k` = **READY**, exact same SHA.
- Last 6h of Vercel runtime error aggregation: **none** (no claim of complete UI or authenticated-path E2E).
- Supabase read-only: `agi_action_queue` has 0 `needs_approval` records; `agi_tasks` retains 14 historical queued/pending tasks (different table); `owner_gate_approvals` has 0 evidence records; 0 fresh nodes.
- 0 open PRs in `hocker.one`, `nova.agi`, `hocker-node-agent` at audit start.

## Visual findings and bounded implementation

1. **Excessive above-the-fold space.** Large duplicated Owner Gate title/card plus expanded safety warning pushes the actual approval table below the bottom dock on a narrow phone. Retain all semantic text but compress the page hero only at ≤720px, and turn the explanatory warning into an accessible, initially closed details disclosure. The server-verified Owner AAL2 gate remains mandatory.
2. **Unnecessarily large approval metrics and header.** `OwnerApprovalCenter` has a 2rem heading, animated grid and three metrics forced into separate rows on small screens. Add CSS strictly under `.hko-owner-actions-page` to render three readable metric columns, tighter header/card spacing and no background grid animation on small screens; keep approval actions and status data visible.
3. **Truncated tab name.** The dock visibly clips `Ecosistema` to `ECOSISTE...`. Use displayed shortLabel `Apps` in mobile only and add `aria-label={item.label}` so assistive technology still reads `Ecosistema`.
4. **Floating icon at right edge.** Its origin could not be determined from the screenshot. Do not disable a potentially user/OS accessibility control or third-party overlay without identifying its source and permission.

## Regression / acceptance conditions

- No changes to AAL2 session checks, Supabase SQL, material Owner actions, GitHub writes other than this UI PR, or AGI workers.
- UI must retain 44px minimum actionable controls, screen reader names, keyboard-accessible details and the same `/owner/actions` route.
- Passing static/CI/build and Vercel Preview confirm code/deploy validity; **true responsive click/scroll/keyboard visual QA still requires a live authenticated Owner session or a controlled browser with that session**. Do not claim pixel-perfect QA from screenshot analysis alone.
- Merge to `main` only after full CI, code review and exact-HEAD Vercel Preview; do not manually trigger production. Record SHA afterward.

References: `docs/superpowers/specs/2026-08-19-hocker-one-ux-limpia-design.md`, `docs/operations/OWNER_UX_ROUTE_BRAND_RECONCILIATION_2026-11-14.md`, Hocker One issue #306.
