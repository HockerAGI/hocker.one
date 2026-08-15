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

---

# Signal v1.1 — Audit reconciliation · 2026-08-15

This addendum supersedes assumptions in the original plan where connected evidence changed after the first preview. It changes neither the control-plane boundary nor the four-destination mobile information architecture.

## A. Evidence precedence and ecosystem drift

HOCKER governance requires connected production/configuration evidence and current code to override stale narrative sources. The canonical August documents still describe five GitHub repositories; the organization now contains nine:

1. `hocker.one`
2. `nova.agi`
3. `hocker-node-agent`
4. `hocker.agi`
5. `chido.casino`
6. `hocker.ads`
7. `chido.lab`
8. `chido.games`
9. `punto.g`

`punto.g` is not implicitly authorized as a Hocker One/NOVA governed repository. Platform-wide reconciliation remains tracked by the separate fail-closed closure work; this UI pass must not silently expand repository permissions or canonical app counts.

## B. Verified preview state

Target branch: `feat/hocker-signal-nova-workspace-20260814`  
Validated preview at audit time: `hocker-n58b4ltem-hockeragi.vercel.app`  
Pre-audit head: `0f219647b3436fe42163d9634a881ac2e30e232b`

Verified:
- password login → Owner session → `/app/nova` no longer loops;
- GitHub CI at the pre-audit head passed tests, typecheck, lint, build and dependency audit;
- Vercel deployment is READY;
- visual mobile E2E exposed defects not represented by existing source-contract tests.

Not verified/green:
- the same preview currently emits MCP initialization errors for Vercel, GitHub and OpenAI with HTTP 404;
- NOVA runtime health is unavailable from the configured endpoint in the tested mobile state;
- the platform-wide Supabase security closure gate remains open;
- therefore PR #213 is not merge-ready despite green build CI.

## C. P0 — Mobile dock must never cover content

Observed defect: cards/text continue behind the fixed mobile dock.

Design:
- define one authoritative mobile dock reserve token owned by the shell;
- reserve `dock visual height + safe-area inset + breathing space` in scrollable private content;
- remove divergent magic spacing between `PrivateShell` and dock CSS;
- compact the dock modestly without reducing touch targets below accessible mobile size;
- keep the dock fixed; do not turn it into normal-flow navigation.

Acceptance:
- last interactive element remains fully visible and tappable above the dock on short and tall phones;
- Android browser/PWA safe-area and Capacitor wrapper use the same layout contract;
- no horizontal clipping or accidental double safe-area padding.

## D. P0 — Owner Gate/GitHub action-chain semantics

Root cause verified in code/data:
- `buildGuidedGitHubChain()` treats rejected/cancelled actions as terminal;
- `GuidedGitHubChainCard` infers “Todo listo / Completado” merely because no non-terminal action remains;
- `completed` counts only executed/completed actions;
- a real three-step chain where all three rows are `rejected` therefore renders “Todo listo”, “Completado”, `0 de 3`, and “Cancelado” simultaneously.

Design:
- derive an explicit chain outcome independent of `nextAction`:
  - `in_progress`
  - `completed`
  - `cancelled`
  - `failed`
- `completed` requires every required step to have an execution-success state;
- rejected/cancelled terminal chains render “Ejecución cancelada” (or equivalent), never “Todo listo”;
- failed terminal chains render a failure outcome with evidence/recovery affordance;
- progress copy distinguishes `ejecutados` from total workflow steps.

Acceptance:
- all-rejected example renders a single coherent cancelled state and `0 de 3 ejecutados`;
- success-only chain renders completed;
- mixed/pending chain remains in progress;
- no action status is cosmetically upgraded beyond stored evidence.

## E. P0 — Contrast and readable hierarchy

Observed defect: explanatory copy, metadata and counters use very low-contrast slate tones on near-black surfaces.

Design:
- preserve the dark HOCKER palette and cyan accent;
- primary text remains near-white;
- secondary explanatory text moves to a clearly readable blue-gray token;
- tertiary muted text is reserved for genuinely optional metadata;
- disabled text is visually distinct from tertiary informational text;
- target WCAG AA contrast for normal body copy and controls wherever the token is used as readable content.

No additional accent colors or glassmorphism are introduced.

## F. P1 — NOVA offline state

Observed defect: generic empty-state robot + large void while NOVA is unavailable.

Design:
- conversation history remains visible;
- workspace shows an intentional compact offline panel:
  - `NOVA sin conexión`
  - human explanation that the runtime did not answer the health check;
  - `Reintentar` action;
  - last verified signal when available;
- composer remains fail-closed for requests that require NOVA and explains why;
- no fake online state or synthetic heartbeat is created.

## G. P1 — NOVA visual identity

Current code uses Lucide `Bot` for NOVA in primary navigation and empty states. The project brand source defines the Corporate Logo as NOVA's principal clean UI identity and the Motion Logo for active digital moments.

Decision for v1.1:
- use the official Corporate `N` mark in normal NOVA surfaces where it improves identity;
- do **not** place the full humanoid avatar in this dense mobile pass;
- reserve the official avatar for future welcome/voice/presence moments where a human-scale portrait adds value;
- never redraw, reinterpret or generatively alter NOVA's approved face/logo;
- when an optimized derivative is required, preserve the supplied original pixels/design and treat it as a derived delivery asset, not a new logo.

Expected replacements:
- NOVA bottom-dock mark;
- NOVA workspace empty/offline mark;
- selected NOVA status/loading surfaces where size permits.

Hocker One product chrome keeps the Hocker One isotype.

## H. P1 — Resources provider readiness must reflect runtime evidence

Observed semantic defect:
- UI maps `configured && !connected` to `Preparado`;
- current preview has configured Vercel/GitHub/OpenAI MCPs that actually failed initialization with HTTP 404;
- cards show `0 herramientas / 0 capacidades`, so “Preparado” understates a real runtime problem.

Design human states:
- `Conectado`: initialized and usable now;
- `Configurado`: credentials/config exist but no successful current connection has been verified;
- `Con problemas`: configuration exists and a current initialization/health attempt failed;
- `Pendiente`: not configured/not ready;
- `Protegido`: governed external module boundary where that is the actual product state.

Rules:
- `lastError`/health evidence can move configured providers to `Con problemas`;
- a provider with zero discovered tools after an initialization error must not appear healthy/prepared;
- keep technical raw error available in detail, not as the primary card headline.

## I. P1 — Compact Resources registry

Provider cards become compact summaries by default:
- icon + provider name + human readiness state;
- one-line purpose;
- concise counts only when meaningful.

Detail/expanded view contains:
- tools;
- capabilities;
- scopes/permissions where safe to display;
- current health/last check;
- authorized AGIs;
- diagnostic detail.

Do not fake install/import actions while the production pipeline does not exist.

## J. P2 — Header/title normalization

Verified route bug:
- `/chat` belongs to the NOVA workspace through `matchPrefixes`, but is not a concrete navigation item;
- `getHockerRouteTitle('/chat')` therefore falls back to the raw final segment and displays `Chat`.

Design:
- legacy/deep-link NOVA routes display `NOVA` in private chrome;
- avoid redundant page title repetition on mobile when Topbar already supplies the primary title;
- preserve desktop context where a page H1 still adds hierarchy.

## K. P2 — Preview floating control

The black floating control visible at the right edge of the supplied screenshots is the Vercel Preview Toolbar, not an Hocker One component. No app navigation/accessibility code should be added to “move” it into `Más`.

Decision:
- keep it available during QA unless it materially obstructs review;
- if clean visual capture is needed, disable the Vercel Toolbar only for the preview branch through supported Vercel preview configuration;
- production UI must be evaluated without mistaking provider-injected preview chrome for application chrome.

## L. Pulso evidence wording

Pulso must not imply that every historical/synthetic signal is a current verified live signal.

Design:
- current verified evidence, stale evidence and legacy/synthetic evidence remain visually/semantically distinct;
- “Sin señal reciente” must remain explicit for stale nodes/AGIs;
- no synthetic record upgrades overall service health.

## M. Asset audit

The current `public/brand` directory contains Hocker One assets but no NOVA asset. The supplied NOVA logo files are 1536×1536 RGB images without an alpha channel.

For v1.1:
- no generative redraw is required;
- prefer the supplied clean orbital `N` Corporate mark;
- avoid the heavier Heritage 3D mark in compact app chrome;
- create only deterministic delivery derivatives if needed for size/performance; no visual redesign.

## N. Test-first implementation order

1. Add failing regression coverage for action-chain outcomes.
2. Add failing source/UI contracts for provider degraded/error semantics, NOVA route title, offline state and dock reserve.
3. Implement semantic fixes before visual polish.
4. Apply contrast/token changes and compact Resources cards.
5. Add NOVA Corporate mark integration without avatar.
6. Run full existing test/type/lint/build/audit suite.
7. Deploy branch preview.
8. Require no new runtime error cluster and explicitly reconcile existing MCP 404s.
9. Recheck mobile/PWA layout and safe areas.
10. Only after evidence is green, perform narrowly proven cleanup of duplicate/obsolete Signal UI code.

## O. Non-goals for this PR

- no production Supabase DDL or broad grants/RLS changes;
- no `allow_actions=true` change;
- no repo allowlist expansion for `punto.g`;
- no credential rotation;
- no merge to `main`;
- no Chido/Hocker Ads feature implementation;
- no full design-system rewrite;
- no avatar redesign or new NOVA persona.
