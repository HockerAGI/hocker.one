# HOCKER Signal · NOVA Workspace

## Objective
Consolidate Hocker One around NOVA as the default private workspace while preserving current security, Owner Gate, PWA, APIs, AGI runtime and deep links. The redesign must reduce navigation and visual drift without rewriting working backend contracts.

## Baseline snapshot
- Base SHA: `a5f4b1838674d6f0c5d648064f8505c280303d34`.
- Existing NOVA runtime UI: `NovaRealtimeChat`, action drafts, Owner Gate state, Command Palette, VoiceInput and WorkspaceContext.
- Existing private shell: Sidebar + Topbar + WorkspaceBar + BottomDock + CommandPalette.
- Existing brand assets: wordmark, dedicated isotype and PWA icon variants in `public/brand`.
- Existing visual debt: oversized `src/app/globals.css`, multiple VFX/background generations and duplicated technical navigation.

## Preserve
- `/api/nova/chat` and `/api/nova/chat/stream`.
- Owner Gate, MFA/AAL2, action queue and evidence contracts.
- `allow_actions` policy and fail-closed behavior.
- PWA registration, offline policy and safe-area behavior.
- Existing technical routes as deep links and Command Palette destinations.
- Official Hocker One logo/isotype assets; never regenerate them.

## Phase 1 — Foundation + navigation
1. Make NOVA the post-login destination and `/app` default.
2. Reduce persistent navigation to `NOVA`, `Pulso`, `Recursos`; mobile adds `Más` as a launcher for secondary/technical destinations.
3. Keep technical routes searchable rather than deleting them.
4. Consolidate decorative shell layers into one `SignalBackdrop`.
5. Increase wordmark prominence on desktop and use the official isotype in compact chrome.

## Phase 2 — NOVA workspace
1. Reframe `NovaRealtimeChat` as the primary workspace, not a nested dashboard card.
2. Keep approvals/actions inline in the conversation using existing action contracts.
3. Preserve queue-lock/Owner Gate status while translating technical language to human labels.
4. Prepare explicit artifact slots for code, images, video, files, previews and sources; only enable adapters that have a real backend/tool.

## Phase 3 — Pulso + Recursos
- `Pulso`: attention, health, active work, changes and cost using existing verified signals.
- `Recursos`: user-facing registry of capabilities; technical types (tool/MCP/connector/plugin/skill) are secondary metadata. Capabilities belong to AGIs; Hocker One only registers, routes and governs them.

## Phase 4 — Cleanup
Only after preview, CI, accessibility and responsive validation:
- remove unused VFX generations and duplicate tokens/components proven unreferenced;
- split `globals.css` into focused modules;
- preserve compatibility redirects/deep links;
- keep dependency upgrades isolated from visual changes.

## Gates
- TDD: target tests must fail before implementation and pass after.
- `npm test`, `typecheck`, `lint`, `build`, dependency audit.
- Vercel preview READY with no runtime error cluster.
- Mobile/desktop responsive verification.
- PWA/private-cache regression tests green.
- No change to `main` until every gate is green and reviewed.
