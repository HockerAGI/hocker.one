# HOCKER Signal v1.1 — Current-Head Audit & Polish Design

**Status:** OWNER REVIEW GATE — implementation is frozen until Owner approves this reconciled spec  
**PR:** #213 · `feat/hocker-signal-nova-workspace-20260814`  
**Audited code head:** `48fe1edfc974a7179c43a04e8cbc03513e80dbca`  
**Base:** `a5f4b1838674d6f0c5d648064f8505c280303d34` (`main`)  
**Audit date:** 2026-08-15  
**Scope:** private Hocker One Signal shell, NOVA, Pulso, Recursos, auth/session, Owner Gate, MCP/readiness, responsive/PWA/Capacitor, accessibility, performance, assets and security boundaries.

> This document supersedes the earlier audit snapshot that was written against `25712a2589c08ca753ac7fdc28d4069003ccbb3d`. The branch advanced after that review-gate document. This reconciliation audits the actual current code candidate and freezes further product implementation until Owner review.

---

## 1. Executive decision

Keep the approved persistent information architecture exactly as:

- **NOVA** — primary conversational/operational workspace.
- **Pulso** — verified attention and operating state.
- **Recursos** — capabilities, providers and governed resources.
- **Más** — launcher for secondary/technical destinations.

Keep the approved NOVA identity policy:

- Corporate/isotype identity may appear selectively where an element specifically represents NOVA.
- Motion identity is reserved for active digital moments where it adds clarity.
- The humanoid avatar is **not** justified for the dense workspace/dock pass and remains omitted.
- Heritage treatment remains premium/splash-only.
- Existing official transparent repo assets are preferred; no redesign/generative reinterpretation.

Recommended strategy remains **semantic-first narrow polish**, not a broad redesign:

1. Truthful state semantics and fail-closed behavior.
2. Mobile safe-area/dock geometry.
3. Hierarchy, contrast, density and accessibility.
4. NOVA identity from official optimized assets only.
5. Narrow cleanup only after behavior is proven.

---

## 2. Audit provenance and current branch state

At audit time PR #213 is open, mergeable, still Draft, targets `main`, and is not merged. The current code head is `48fe1edfc974a7179c43a04e8cbc03513e80dbca`.

The prior spec audited `25712a2589c08ca753ac7fdc28d4069003ccbb3d`. The branch is now 31 commits ahead of that code snapshot. Therefore several items that were previously design requirements have already been partially or fully implemented. This audit does **not** silently approve those changes; it evaluates them against the approved direction and identifies what remains unresolved.

Current automated evidence at the audited code head:

- GitHub Actions CI run #694: `success`.
- Exact-head Vercel preview: `dpl_d3cY6TJrTZpF7PwM1jfEZirLxMHh`, `READY`.
- Vercel deployment URL: `hocker-ftmlcz3gy-hockeragi.vercel.app`.
- No merge to `main` is authorized by this audit.

### Runtime evidence precedence

Use this order when evidence conflicts:

1. Authenticated runtime evidence from the exact candidate deployment.
2. Current source plus current connected-platform configuration.
3. Automated behavior tests.
4. This design specification.
5. Historical screenshots/narrative.

A UI label may never upgrade state beyond the strongest current evidence.

---

## 3. Proven runtime finding — MCP 404s and duplicate reporting

The MCP failure is not hypothetical. Vercel runtime observability still records the authenticated `/app/recursos` failure pattern from an earlier candidate deployment:

- Vercel MCP initialization → HTTP 404.
- OpenAI-related remote MCP initialization → HTTP 404.
- GitHub MCP initialization → HTTP 404.
- Each Vercel/OpenAI/GitHub failure was reported once by its connector and again by the registry.
- The registry also owns `alertMcpProviderDown`, so one failed attempt can create duplicated error noise before the alert boundary.

The retained error groups currently point to an older deployment, not the new exact head. Therefore:

- **Proven:** the duplicate provider+registry reporting architecture exists and has occurred at runtime.
- **Not yet proven on `48fe1edf…`:** those three providers still return 404 after the later MCP endpoint/protocol changes.
- **Required final gate:** authenticated `/app/recursos` must be re-opened on the exact final deployment and its status/log evidence rechecked.

---

## 4. Security and governance invariants

Signal v1.1 must preserve all of the following:

- Owner Gate and human approval for protected mutations.
- MFA/AAL2 escalation where required.
- RLS and least privilege.
- Existing `allow_actions` policy and fail-closed mutation behavior.
- No direct write to `main` in this workflow.
- No credential rotation or production-data mutation as part of UI polish.
- No service-role/secret key exposure to browser bundles.
- Private pages/API responses remain excluded from service-worker caching.
- Secondary technical routes remain reachable by deep link/search.
- No fake `connected`, `online`, `ready`, `completed`, `installed` or `verified` state.

### New current-head security note

`src/lib/mcp/mcp-github.ts` exposes low-level write helpers whose default arguments can target `main` (for example default branch/ref behavior). Higher-level Owner Gate/policy boundaries must remain the only route by which those helpers are invoked for writes. The connector must not become a bypass path. No change is authorized here until a separate TDD-backed policy test proves the protected-branch contract.

---

## 5. Exhaustive changed-file audit — 41 files

| # | File | Current audit result | Action before merge |
|---|---|---|---|
| 1 | `docs/plans/2026-08-14-hocker-signal-nova-workspace.md` | Historical plan; contains superseded assumptions from earlier audit stages. | Keep historical; this spec is v1.1 authority. |
| 2 | `docs/superpowers/specs/2026-08-15-hocker-signal-v1-1-audit-polish-design.md` | Previous snapshot became stale as branch advanced. | Reconciled by this document; freeze implementation for Owner review. |
| 3 | `env.example` | Separates Vercel REST vs MCP credentials and OpenAI API vs explicit remote-MCP credentials; documents legacy fallbacks. | Preserve separation; no secret values in repo. |
| 4 | `src/app/api/auth/password-login/route.ts` | Existing Preview Supabase alias/session repair is security-critical. | Preserve login/session semantics exactly. |
| 5 | `src/app/app/page.tsx` | Private app default resolves to NOVA. | Preserve. |
| 6 | `src/app/app/pulso/page.tsx` | Uses evidence-based progress and operational status distinctions; still visibly repeats `Pulso` under mobile Topbar. | Keep semantics; remove visual title duplication on mobile without removing semantic H1. |
| 7 | `src/app/app/recursos/page.tsx` | Readiness now derives from `connected/configured/lastError`; cards are more compact and zero counts are hidden. Still visibly repeats `Recursos`; server render can initialize registry. | Preserve truthful mapper; solve title hierarchy; ensure page render does not become alert spam. |
| 8 | `src/app/apps/page.tsx` | Adds evidence-based completion rather than subjective progress. | Preserve truthful gate definition; no cosmetic 100% claims. |
| 9 | `src/app/chat/page.tsx` | Legacy route reuses NOVA workspace. | Preserve compatibility; chrome title must remain NOVA. |
| 10 | `src/app/integrations/page.tsx` | Uses readiness/progress, but section copy still says `MCP conectado`/`herramientas disponibles` even when providers can be degraded/configured. Renders raw `lastError` directly. | Neutralize presuppositional copy; sanitize/compact diagnostics before rendering. |
| 11 | `src/app/layout.tsx` | Loads Signal v1.1 CSS after legacy CSS; preserves viewport-fit cover and PWA registration. | Preserve order and PWA/security settings. |
| 12 | `src/components/AuthBox.tsx` | Auth behavior is separate from polish. | Preserve; add live-region only if touched. |
| 13 | `src/components/BottomDock.tsx` | Approved NOVA · Pulso · Recursos · Más IA remains. | Preserve IA and >=44px targets; verify collision matrix. |
| 14 | `src/components/CommandPalette.tsx` | Secondary destinations remain searchable with dialog semantics. | Preserve keyboard/focus behavior. |
| 15 | `src/components/GuidedGitHubChainCard.tsx` | Contradictory `Todo listo/Completado/0 de 3/Cancelado` defect is now addressed by a derived outcome helper. | Keep; verify RED→GREEN tests cover rejected, failed, success and pending chains. |
| 16 | `src/components/NovaRealtimeChat.tsx` | Fail-closed Owner Gate retained; offline recovery panel now exists. Still repeats `NOVA` inside a route titled NOVA and still uses generic Sparkles instead of official NOVA isotype. | Normalize mobile identity hierarchy; preserve raw status/fail-closed behavior. |
| 17 | `src/components/PrivateShell.tsx` | Uses `--hko-mobile-dock-reserve` instead of old hard-coded 7.5rem. | Keep; manual Android/PWA/Capacitor proof still required. |
| 18 | `src/components/Sidebar.tsx` | Correct three-space desktop IA; independent approval polling remains. | Preserve IA; no new polling layer. |
| 19 | `src/components/Topbar.tsx` | Correct compact shell; contributes to duplicated mobile page titles. | Define Topbar as mobile visual title owner; preserve action/MFA failure behavior. |
| 20 | `src/components/hocker-2c/auth/HockerOwnerLoginSurface.tsx` | Uses Hocker One product identity. | Preserve; no NOVA avatar here. |
| 21 | `src/components/nova/NovaWorkspace.tsx` | Supplemental action-chain polling/mutations preserve MFA routing. | Preserve mutation boundary; do not weaken Owner Gate. |
| 22 | `src/components/signal/SignalBackdrop.tsx` | Lightweight shell background. | Preserve; no VFX/canvas reintroduction. |
| 23 | `src/global.d.ts` | Declares scoped MCP/env variables, including server credentials. | Ensure declarations never imply browser exposure; only `NEXT_PUBLIC_*` is public. |
| 24 | `src/lib/hocker-navigation.ts` | Three workspaces are canonical; legacy `/chat` title mapping was part of polish. | Preserve NOVA title normalization. |
| 25 | `src/lib/hocker-signal-state.d.mts` | Type contract for shared Signal state helper. | Keep synchronized with implementation. |
| 26 | `src/lib/hocker-signal-state.d.ts` | Duplicate declaration surface for module resolution compatibility. | Keep synchronized; remove only with proven toolchain simplification later. |
| 27 | `src/lib/hocker-signal-state.mjs` | Pure helpers now implement provider readiness, action-chain outcome and evidence-based progress. | Preserve semantic purity; these helpers are authoritative presentation policy. |
| 28 | `src/lib/mcp/mcp-client.ts` | Added JSON/SSE parsing and modern/legacy negotiation. Transport logic is materially larger than UI polish and carries protocol compatibility risk. | Do not extend further in this review cycle; reverify against actual provider behavior on exact final preview. |
| 29 | `src/lib/mcp/mcp-github.ts` | Uses GitHub remote MCP endpoint; connector still logs initialization failure before registry logs it; low-level write helpers exist. | Registry should own incident alert/error; retain connector diagnostic without duplicate error incident. Protect write invocation through policy/Owner Gate. |
| 30 | `src/lib/mcp/mcp-openai.ts` | Correctly treats OpenAI API and explicit remote MCP as different credentials/endpoints; still connector-level error log duplicates registry. | Preserve credential separation; dedupe incident ownership. |
| 31 | `src/lib/mcp/mcp-vercel.ts` | Uses explicit Vercel MCP credential, not ordinary REST token; connector-level error log duplicates registry. | Preserve credential separation; prove auth flow by runtime, not env presence; dedupe incident ownership. |
| 32 | `src/lib/require-private-session.ts` | Centralized Supabase server-config readiness prevents prior post-login redirect loop. | Preserve exactly. |
| 33 | `src/lib/supabase-server.ts` | Supports canonical/server-scoped/HockerSupabase aliases while refusing secret/service-role as public auth fallback. | Preserve; no client leakage. |
| 34 | `src/styles/hocker-signal-v11.css` | Introduces readable contrast tokens and shell reserve. Reserve includes safe area, while dock wrapper still contains its own safe-area padding term. | Treat as partially reconciled until viewport tests prove no overlap/double gap; then simplify to one geometry owner. |
| 35 | `tests/hocker-signal-v11.test.mjs` | New v1.1 semantic/source contracts. | Keep; ensure behavior assertions dominate brittle literals. |
| 36 | `tests/hocker-signal-workspaces.test.mjs` | Protects workspace boundaries. | Keep green. |
| 37 | `tests/mcp-protocol-2026.test.mjs` | Exercises expanded transport negotiation. | Keep, but runtime provider proof remains mandatory. |
| 38 | `tests/mcp-provider-endpoints-2026.test.mjs` | Locks endpoint/auth separation expectations. | Keep; do not treat endpoint string test as successful connectivity. |
| 39 | `tests/nova-signal-composer.test.mjs` | Protects composer/voice/offline contracts. | Extend only after Owner approval if a missing fail-closed state is found. |
| 40 | `tests/supabase-server-env.test.mjs` | Critical regression test for Preview auth aliases/session. | Must remain green. |
| 41 | `tests/unified-navigation-ux.test.mjs` | Protects NOVA/Pulso/Recursos/Más and route-title UX. | Keep green; add only targeted mobile-title/reserve behavior if approved. |

---

## 6. Current implementation versus approved findings

### P0 — Action-chain contradiction: materially fixed, verify behavior

Current code derives a chain outcome independent of `nextAction`:

- success terminal states → `completed`;
- cancellation/rejection terminal states → `cancelled`;
- failure/error states → `failed`;
- otherwise → `in_progress`.

The card now uses that outcome for headline/status and reports `x de y ejecutados`. This is aligned with the approved semantic direction.

Remaining gate: targeted tests must demonstrate all-rejected → cancelled, all-executed → completed, terminal error → requires review, and pending → in progress.

### P0 — Recursos readiness: materially fixed in compact view, secondary page still needs copy hardening

The primary Recursos page now distinguishes:

- `Conectado` — current connection proof.
- `Configurado` — configuration exists without current success/error proof.
- `Con problemas` — configuration exists plus current `lastError`.
- `Pendiente` — missing configuration.

This fixes the former `Preparado` false-positive semantics.

Remaining issues:

- `/integrations` still labels the section `MCP conectado` even though it may contain configured/problem providers.
- `/integrations` renders raw provider error strings; sanitize/compact them before user-facing output.
- Rendering Recursos/Integrations can still initialize providers and emit alerts; incident ownership must be one-per-attempt.

### P0 — Dock safe area: partially fixed, physical proof missing

Current `PrivateShell` consumes `--hko-mobile-dock-reserve` and no longer carries the old 7.5rem literal. The focused CSS defines readable tokens and a reserve based on visual height + safe-area + breathing room.

However `.hko-bottom-dock-wrap` still separately includes `env(safe-area-inset-bottom) + 10px`. This may be geometrically correct, but there are still two expressions describing dock/safe-area geometry. Do not declare the overlap issue closed until Android browser, short-height viewport, installed PWA and Capacitor prove:

- last actionable content fully clears the dock;
- no double safe-area gap;
- keyboard open/closed state remains usable;
- no horizontal clipping.

### P1 — NOVA offline/recovery: improved, identity hierarchy remains

Current offline view now contains:

- `NOVA sin conexión`;
- a human explanation;
- last verified signal;
- `Reintentar`;
- preserved fail-closed runtime/Owner Gate behavior.

Remaining:

- chat header still displays full `NOVA` while mobile Topbar already owns route title;
- generic `Sparkles` remains in the presence/offline identity slot;
- official NOVA isotype has not yet been selectively integrated in this audited head.

### P1 — Heading duplication: still open

Visible page H1s remain in both Pulso and Recursos while mobile Topbar also supplies route identity. The correct design is:

- keep one semantic H1 for document accessibility;
- on mobile, Topbar is the visual route-title owner;
- reduce/hide duplicate visual H1 treatment without hiding essential context from assistive technology;
- preserve richer desktop hierarchy.

### P1 — Contrast: improved

Focused tokens now define:

- `--hko-text-secondary: #aebfd1`;
- `--hko-text-tertiary: #7f93aa`.

Current Pulso/Recursos use the secondary token for important explanatory text. Continue removing essential information from legacy slate-600/700 usage only where touched; do not conduct a global stylesheet rewrite in #213.

### P1 — Provider-card density: improved

Primary Recursos provider cards are significantly more compact and omit zero tool/capability counters when meaningless. Keep the compact summary/detail pattern.

### P1 — Floating right-edge control

No changed/current Signal component maps to the black floating screenshot control. Prior evidence identifies the Vercel Preview Toolbar. Product CSS must not be distorted to accommodate an injected preview control. During final visual QA, classify the overlay again before treating it as application-owned accessibility UI.

---

## 7. MCP architecture audit

### 7.1 Truthfulness boundary

Environment/config presence is not runtime readiness. `is*Configured()` must never be rendered as equivalent to connected.

### 7.2 Duplicate incident ownership

Current connectors (`mcp-vercel`, `mcp-openai`, `mcp-github`) log their initialization error, then the registry catches the same thrown error and logs it again before issuing `alertMcpProviderDown`.

Required boundary after Owner approval:

- connector returns/throws diagnostic state; optional debug trace only;
- registry owns the provider initialization error incident and alert;
- UI reads registry state only;
- diagnostic evidence is retained, not suppressed.

### 7.3 Render-triggered initialization

`/app/recursos` and `/integrations` can initialize the registry as part of dynamic server rendering. In serverless execution, cold instances can repeat initialization and alerts. Final design should avoid turning page viewing into an uncontrolled incident generator. This can be solved narrowly (registry-level dedupe/cooldown or explicit health refresh boundary) without introducing a global client store.

### 7.4 Transport/protocol risk

`mcp-client.ts` now contains both a modern negotiation probe and initialize-era fallback plus SSE/JSON parsing. This change is materially larger than a visual polish task. No additional protocol invention is authorized in this pass. Exact-provider runtime evidence is required before calling the MCP layer healthy.

### 7.5 Credentials

Preserve these separations:

- `VERCEL_TOKEN` = ordinary Vercel REST/API credential; not implicitly MCP auth.
- `VERCEL_MCP_AUTH_TOKEN` = explicitly scoped MCP credential.
- `OPENAI_API_KEY` = OpenAI API credential; never forwarded to arbitrary remote MCP hosts.
- `OPENAI_MCP_URL` + `OPENAI_MCP_AUTH_TOKEN` = explicit remote MCP only.
- GitHub MCP token remains server-side and governed.

---

## 8. Owner Gate, auth/session and client/server audit

### Supabase/Auth

The previous Preview regression was caused by inconsistent server-side env-name expectations. Current server client/session guard centralizes alias readiness and has dedicated tests. Do not refactor it during UI polish.

### Owner Gate

NOVA runtime reads remain fail-closed when actions/queue state cannot be read. Protected mutations remain subject to approval and MFA/AAL2. UI status changes must not bypass the server contract.

### Client/server boundary

Keep:

- auth/session/Supabase config server-side;
- secret/service-role credentials server-only;
- sanitized provider diagnostics before rendering;
- interactive mutation controls client-side only where needed;
- no new global client provider solely for visual polish.

---

## 9. Accessibility, responsive, PWA and Capacitor requirements

Must preserve/verify:

- visible `:focus-visible` treatment;
- >=44 CSS px touch targets, aiming 48–54px for primary mobile dock controls;
- `aria-current="page"` on active persistent navigation;
- `aria-expanded` and explicit labels on expandable/icon-only controls;
- Command Palette keyboard/focus behavior;
- polite live-region announcement for user-triggered status/error changes where applicable;
- no essential state conveyed by color only;
- reduced-motion behavior;
- readable secondary contrast;
- no duplicate navigation landmarks/route-title confusion.

PWA/Capacitor guardrails:

- `viewportFit: "cover"` remains.
- service worker must not cache authenticated pages or API responses.
- Capacitor stays HTTPS/no cleartext/no mixed-content/debugging regression.
- same dock/safe-area contract must work in browser, standalone PWA and Capacitor WebView.

---

## 10. Performance and image audit

### NOVA assets

Official repo assets already exist:

- `public/ecosystem/agis/nova/icon.png` (~567 KB).
- `public/ecosystem/agis/nova/logo.png` (~1.12 MB).
- `public/ecosystem/asset-map.json` maps them to official transparent NOVA masters.

Policy:

- use the existing official transparent isotype for compact NOVA identity;
- no avatar in v1.1 dense workspace;
- no Heritage mark in dock/header;
- if repeated 20–48px use is approved, create a deterministic 128/256px transparent derivative without changing design;
- never ship a 1536px black-background source into a tiny control;
- set explicit dimensions and avoid unnecessary `priority` preloads.

### Polling

Current private surfaces still independently poll approvals/actions/runtime. Do not add another interval. Polling consolidation is a later isolated performance task unless a tiny, low-risk primitive is proven safer with tests.

---

## 11. Remaining implementation plan — ONLY after Owner approval

### RED 1 — residual semantic/copy safety

Add/confirm tests for:

- terminal cancelled chain never renders completed;
- provider with `lastError` is `Con problemas`;
- `/integrations` does not presuppose all MCP providers are connected;
- rendered diagnostic is compact/sanitized.

Then make the smallest code changes.

### RED 2 — MCP incident dedupe

Create a failing test showing one provider initialization failure results in one registry-owned incident/alert while preserving `lastError` evidence. Then remove connector-level duplicate error incident logging or lower it to non-incident diagnostic trace.

### RED 3 — mobile heading hierarchy

Test that mobile chrome owns the route title while Pulso/Recursos retain a semantic H1 without a second large visual heading. Keep desktop hierarchy.

### RED 4 — dock physical contract

Keep source contract tests, then validate real viewport behavior. If overlap/double-gap remains, change only the focused Signal geometry token/wrapper rules; do not add another arbitrary `rem` patch.

### RED 5 — NOVA compact identity

If approved, introduce only an optimized derivative of the official NOVA isotype and test that the asset is transparent, explicitly sized and not a source-size payload. Replace generic identity icon only where it improves recognition; no avatar.

### RED 6 — exact-preview runtime gate

On one final head SHA:

- deploy Preview and require `READY`;
- valid Owner login reaches `/app/nova`;
- wrong password fails safely without 500;
- MFA/AAL2 remains intact;
- inspect `/app/recursos` authenticated;
- providers show states matching current evidence;
- inspect Vercel runtime errors for the exact deployment;
- verify no duplicate provider+registry incident for a single failure;
- if MCP remains unavailable, UI must show `Con problemas`, not fake connected/prepared.

---

## 12. Final verification matrix

### Automated

- targeted RED→GREEN tests;
- full test suite;
- typecheck;
- lint;
- production build;
- dependency/security audit;
- GitHub CI on the exact final SHA.

### Runtime

- exact final Vercel deployment `READY`;
- authenticated Owner E2E;
- wrong-credential fail-safe;
- Owner Gate/MFA/AAL2 path;
- NOVA online/checking/problem/offline labels match evidence;
- `/app/recursos` truthful readiness;
- no new runtime error cluster;
- one provider failure = one incident owner.

### Mobile/PWA/Capacitor

Minimum matrix:

- narrow Android browser;
- short-height Android browser;
- keyboard open/closed;
- standalone installed PWA;
- Capacitor Android WebView;
- safe-area inset 0 and non-zero simulations where available.

Acceptance:

- last actionable content is never behind dock;
- no double safe-area gap;
- no horizontal clipping;
- NOVA/Pulso/Recursos/Más remain tappable;
- injected Preview Toolbar is not mistaken for product chrome.

---

## 13. Cleanup allowed only after functional gates

Allowed:

- consolidate proven duplicate bottom-dock geometry rules;
- remove unused Signal-specific class generation after repo-wide reference proof;
- remove obsolete imports made unreachable by this PR.

Not allowed in #213 without separate review:

- entire `globals.css` rewrite/split;
- broad polling/store architecture replacement;
- MCP platform rewrite;
- production Supabase DDL/grant/RLS changes;
- credential rotation;
- repository allowlist expansion;
- NOVA avatar redesign/generation;
- Heritage identity in compact chrome;
- fake install/import/attachment features.

---

## 14. Acceptance definition

Signal v1.1 is human-merge-ready only when the **same final SHA** satisfies all of these:

1. NOVA · Pulso · Recursos · Más remains persistent mobile IA.
2. Cancelled/failed workflows never display as completed.
3. Recursos/Integrations provider labels match current runtime evidence.
4. One MCP initialization failure produces one incident owner while retaining diagnostic evidence.
5. NOVA problem/offline state is compact, recoverable and fail-closed.
6. Mobile route-title hierarchy is not visually duplicated.
7. Dock does not overlap content or double-count safe area in browser/PWA/Capacitor.
8. Essential secondary text is readable and state is not color-only.
9. Only official NOVA assets are used; no avatar; no source-size payload in tiny controls.
10. Owner Gate, Supabase session, MFA/AAL2, RLS and private-cache policy remain intact.
11. Targeted tests + full tests + typecheck + lint + build + CI + dependency audit are green.
12. Exact final Preview is READY and authenticated Owner E2E passes.
13. `/app/recursos` runtime health is explicitly reverified on that exact deployment.
14. PR #213 remains Draft until Owner reviews the evidence.

---

## 15. Self-review

### Spec coverage

Checked against the requested audit dimensions: UI/UX, mobile safe areas, accessibility, responsive/PWA/Capacitor, typography/contrast, duplicate headings, navigation, dock overlap, semantic status correctness, Owner Gate, Supabase auth/session, NOVA states, Recursos readiness, MCP health, duplicate logging, performance, image sizing, dead/duplicate CSS scope, client/server boundaries, security regressions and runtime errors are all represented.

### Current-head reconciliation

The earlier document is no longer treated as a current audit because code advanced after it. This version explicitly distinguishes:

- requirements already implemented and needing verification;
- unresolved product/UI debt;
- runtime findings proven on older candidates;
- final-head evidence still missing.

### Safety review

No secret values are included. No production mutation is proposed. No `main` write is authorized. No runtime failure is cosmetically upgraded to healthy. No avatar redesign is authorized.

### Placeholder scan

No TBD/TODO/future-placeholder requirement is used as an acceptance criterion. Each remaining change has a concrete RED test target and verification gate.

---

## REVIEW GATE

**Stop here.** This reconciled spec is the handoff for Owner review. Do not continue implementation merely because current CI/Vercel are green. The current head contains partial v1.1 implementation, but merge readiness is not established until the remaining semantic, MCP incident, mobile visual and authenticated exact-preview gates above are reviewed and completed after Owner approval.
