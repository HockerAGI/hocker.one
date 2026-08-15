# HOCKER Signal v1.1 — Audit & Polish Design

**Status:** review gate — no implementation is authorized by this document alone  
**PR:** #213 · `feat/hocker-signal-nova-workspace-20260814`  
**Audited head:** `25712a2589c08ca753ac7fdc28d4069003ccbb3d`  
**Base:** `a5f4b1838674d6f0c5d648064f8505c280303d34` (`main`)  
**Scope:** private Hocker One Signal shell, NOVA, Pulso, Recursos, auth/session, runtime/readiness semantics, mobile/PWA/Capacitor and adjacent code required to validate those surfaces.

---

## 1. Executive decision

Signal v1.1 keeps the already approved information architecture:

- **NOVA** — primary conversational/operational workspace.
- **Pulso** — verified attention and operating state.
- **Recursos** — capabilities, providers and governed resources.
- **Más** — launcher for secondary/technical destinations; it is not a fourth backend domain.

The recommended implementation strategy is **semantic-first narrow polish**:

1. Correct state semantics and fail-closed behavior first.
2. Correct mobile layout/safe-area ownership second.
3. Normalize hierarchy, contrast and density third.
4. Add NOVA identity only from the existing official asset set, using optimized derivatives where needed.
5. Remove only duplicate/dead UI rules that are proven unused or superseded.

This PR must **not** become a broad design-system rewrite, MCP platform rewrite, Supabase security migration or infrastructure cleanup project.

---

## 2. Evidence model and audit provenance

### 2.1 Current-source evidence

The audit inspected every file changed by PR #213 and the current adjacent files that determine behavior for navigation, runtime state, MCP readiness, PWA/mobile layout and NOVA assets.

The audited current head is `25712a2589c08ca753ac7fdc28d4069003ccbb3d`.

### 2.2 Runtime evidence

There are two distinct evidence classes and they must not be conflated:

- **Current-head deployment evidence:** the current head has a Vercel preview deployment in `READY` state. It is a documentation-only successor to the last authenticated code candidate.
- **Historical authenticated preview evidence:** on deployment `dpl_BWGz5e8SP135GRCt7qLnKMuvcjNR`, valid Owner authentication was proven after the Supabase preview-alias/session fixes. Opening `/app/recursos` on that authenticated preview produced initialization failures for the Vercel MCP, OpenAI MCP and GitHub MCP, reported as HTTP 404 failures. Those failures were emitted both at connector and registry levels and triggered provider-down alerts.

Current Vercel log retention no longer exposes the old detailed records, so the MCP 404 finding is retained as a **proven prior preview finding**, not restated as a fresh current-head reproduction.

### 2.3 Evidence precedence

When evidence conflicts, use this order:

1. Live authenticated runtime evidence from the exact candidate deployment.
2. Current code and current connected-platform configuration.
3. Automated tests that assert behavior rather than strings alone.
4. Current committed design/spec documentation.
5. Historical narrative or screenshots.

No UI label may upgrade runtime state beyond evidence available at that moment.

---

## 3. Guardrails preserved

Signal v1.1 must preserve all existing security boundaries:

- Owner Gate and human approval for protected mutations.
- MFA/AAL2 escalation where required.
- RLS and least-privilege database behavior.
- `allow_actions` policy and existing fail-closed mutation paths.
- No direct writes to `main`.
- No credential rotation or production data mutation as part of UI polish.
- No service-role/secret key exposure to browser/client bundles.
- Private PWA navigation must never cache authenticated pages or API responses.
- Secondary/technical routes remain reachable as deep links/search destinations.
- No fake “connected”, “ready”, “online”, “completed”, “installed” or “verified” state.

---

## 4. Audit inventory — all PR-changed files

| File | Audit result | Required v1.1 action |
|---|---|---|
| `docs/plans/2026-08-14-hocker-signal-nova-workspace.md` | Contains the original Signal plan plus a v1.1 reconciliation addendum. Several findings are valid, but its asset note incorrectly says no NOVA asset exists in the repo. | Keep as historical plan; this spec becomes the implementation design authority for v1.1 polish. |
| `src/app/api/auth/password-login/route.ts` | Successful login redirects to `/app/nova`. Existing backend auth/session contract was already repaired for Preview aliases. | Preserve. No visual task may change authentication semantics. |
| `src/app/app/page.tsx` | Private default re-exports NOVA. | Preserve. |
| `src/app/app/pulso/page.tsx` | Good separation from chat; attention states include degraded/stale/offline/unknown. Weak secondary contrast remains; top “Señal verificada/parcial” needs to remain tied to verified evidence only. | Polish hierarchy/contrast; do not upgrade stale/configured evidence. |
| `src/app/app/recursos/page.tsx` | Server render may call `registry.initializeAll()`. Provider state ignores `lastError`; `configured && !connected` becomes `Preparado`. H1 duplicates mobile Topbar title. Cards are oversized for 0-tool/0-capability states. | Correct readiness state model, compact cards, reduce duplicate title hierarchy, avoid healthy labels after init failure. |
| `src/app/chat/page.tsx` | Correctly reuses `NovaWorkspace`, but legacy `/chat` title resolves to raw `Chat` in Topbar. | Route-title normalization only. |
| `src/components/AuthBox.tsx` | Simplified login UI; uses accessible input labels and the private redirect. Error rendering is visible but not explicitly announced. | Preserve auth behavior; optional `aria-live` only if touched. |
| `src/components/BottomDock.tsx` | Correct 3 workspaces + Más. Fixed dock reserve is not owned by this component; active/status badge logic is fine. More button styling diverges from legacy anchor CSS. | Define one shell-owned mobile reserve contract and normalize dock item rules. |
| `src/components/CommandPalette.tsx` | Keeps secondary destinations searchable and uses dialog semantics. | Preserve keyboard/focus behavior; no navigation expansion. |
| `src/components/NovaRealtimeChat.tsx` | Correct fail-closed queue fallback; duplicate NOVA identity inside a route already titled NOVA; offline state still shows a large generic empty area; `configured` is labeled `Preparada`; low-contrast metadata/placeholder; no dedicated degraded state. | Introduce explicit runtime presentation states, compact recovery UI, improve hierarchy/contrast and status announcements. |
| `src/components/PrivateShell.tsx` | Mobile main reserve is a hard-coded `7.5rem + safe-area`; dock CSS independently owns safe-area and multiple legacy overrides. | Replace magic spacing with a single authoritative reserve token. |
| `src/components/Sidebar.tsx` | Correct 3-space desktop navigation. Polls approvals independently. | Preserve IA; consider shared status polling only if safely isolated. |
| `src/components/Topbar.tsx` | Correct compact shell, but duplicates page H1s on mobile. Polls approvals separately. Approval mutation UI does not inspect detailed failure/MFA response, though backend remains fail-closed. | Normalize heading ownership; if approval behavior is touched, preserve/reflect backend failure and MFA response. |
| `src/components/hocker-2c/auth/HockerOwnerLoginSurface.tsx` | Uses Hocker One logo and simplified login. | Preserve; no NOVA avatar on auth unless separately justified. |
| `src/components/nova/NovaWorkspace.tsx` | Supplemental action chain polls every 20s. Mutation path correctly routes MFA requirement to `/auth/mfa`. Load failure is silently ignored. | Preserve mutation contract; improve action-chain outcome semantics in helpers/card, not by weakening this component. |
| `src/components/signal/SignalBackdrop.tsx` | Appropriate lightweight replacement for old animated private background layers. | Preserve; avoid reintroducing VFX layers. |
| `src/lib/hocker-navigation.ts` | Canonical 3-workspace IA is correct. `/chat` is a NOVA match prefix but not a concrete item, so `getHockerRouteTitle('/chat')` falls back to `Chat`. | Make legacy/deep-link NOVA routes title as NOVA. |
| `src/lib/require-private-session.ts` | Reuses centralized server Supabase config readiness; avoids the old post-login redirect loop. | Preserve exactly. |
| `src/lib/supabase-server.ts` | Correct canonical + server-scoped + HockerSupabase alias fallback; explicitly avoids secret/service-role keys as publishable auth fallback. | Preserve; no client exposure. |
| `tests/hocker-signal-workspaces.test.mjs` | Protects Pulso/Recursos workspace existence but largely source-string based. | Extend with semantic readiness contracts after RED tests. |
| `tests/nova-signal-composer.test.mjs` | Protects real voice input and disabled attachment affordance. | Extend with offline/degraded presentation contract. |
| `tests/supabase-server-env.test.mjs` | Strong regression contract for Preview alias/session fix. | Must remain green; no changes unless needed by real contract change. |
| `tests/unified-navigation-ux.test.mjs` | Protects 3-workspace + Más architecture and primary/secondary navigation. | Extend route-title and dock-reserve semantics; avoid brittle visual literals where possible. |

---

## 5. Adjacent-file audit required by the changed surfaces

### 5.1 Action-chain semantics

`src/components/GuidedGitHubChainCard.tsx` derives the overall card headline from `nextAction`:

- no `nextAction` → `Todo listo`;
- no `nextAction` → `Estado: Completado`;
- no `nextAction` → `Cadena completada`.

`src/components/nova-chat-helpers.ts` simultaneously:

- treats `rejected`, `cancelled`, `canceled`, `executed`, `completed` as terminal;
- counts only `executed` and `completed` as completed.

Therefore an all-rejected three-step chain can legitimately produce:

- `Todo listo`;
- `Completado`;
- `0 de 3 completados`;
- each step `Cancelado`.

This is a **P0 semantic defect**, not just copy polish.

### 5.2 Runtime types

`RuntimeServiceStatus` currently permits only:

- `online`;
- `configured`;
- `offline`;
- `unknown`.

There is no first-class `degraded` NOVA service state in this contract even though other operational models support degradation. v1.1 should not invent a backend state; presentation may derive a human `problem`/`degraded` display state from current error + health evidence while retaining raw source status.

### 5.3 MCP registry and connectors

`src/lib/mcp/mcp-registry.ts`:

- initializes configured providers concurrently;
- catches connector failures;
- logs a registry-level error;
- calls `alertMcpProviderDown`;
- exposes `lastError`, `lastPingAt`, discovered capabilities and tool counts.

Connectors such as `src/lib/mcp/mcp-vercel.ts` also catch and log their own initialization failure before rethrowing. That produces duplicate provider + registry error logging for the same failed attempt. The registry should be the single alert owner; connector logs may remain diagnostic only if deduplicated/correlated.

`isVercelMcpConfigured()` currently means only “a Vercel token exists”. It does **not** mean the configured MCP endpoint answered or that tools were discovered. The same semantic distinction applies to GitHub/OpenAI.

### 5.4 Pulso operational evidence

`src/lib/hocker-operational-state.ts` correctly distinguishes:

- `online` from fresh successful evidence;
- `stale` from historical but old evidence;
- `configured` from a registered profile without recent worker proof;
- `offline/degraded/unknown` where applicable.

The UI must retain those distinctions. A configured item must not be rendered as live. Historical run evidence must not upgrade current service health.

### 5.5 PWA / Capacitor

Current contracts are security-positive:

- `src/app/manifest.ts` starts at `/app/nova`, uses standalone display and Hocker One PWA icons.
- `public/sw.js` caches only the static offline document and explicitly does not cache APIs, authenticated successful navigation responses or private page content.
- `capacitor.config.ts` points the Android wrapper at the HTTPS production URL, disables cleartext/mixed content and WebView debugging.
- root viewport uses `viewportFit: "cover"`, so safe-area ownership is part of the app layout contract.

Signal v1.1 must change only layout spacing, not private caching/security policy.

### 5.6 CSS and dead/duplicate generations

`src/app/globals.css` is a large master stylesheet and contains multiple generations of bottom-dock rules:

- base fixed dock/safe-area padding;
- mobile overrides;
- later z-index/glass overrides;
- later minimum-height overrides;
- another final glass/active override;
- legacy `.hko-bottom-dock-search-btn` rules although Signal `Más` now uses direct Tailwind classes.

Meanwhile `PrivateShell` separately reserves `calc(env(safe-area-inset-bottom) + 7.5rem)`.

The observed overlap is consistent with **two independent sources of truth plus duplicate legacy dock CSS**. v1.1 should consolidate dock geometry into one token/contract, then remove only the duplicate dock rules proven superseded.

Old VFX components removed from `PrivateShell` are cleanup candidates, not automatic deletion targets. A repo-wide reference check is required before deleting any component/CSS generation.

### 5.7 Polling/performance

The private shell currently has overlapping periodic reads:

- `Topbar`: pending actions every 20s;
- `NovaWorkspace`: actions every 20s;
- `NovaRealtimeChat`: runtime summary + actions every 30s;
- `BottomDock`: pending actions every 30s;
- `Sidebar`: pending actions on its own interval.

This is not a security defect, but it is avoidable duplicate network work and can amplify runtime/log noise. v1.1 should not introduce another polling layer. Consolidation is optional only if it can be done without destabilizing current state ownership; otherwise retain behavior and record it for a later isolated performance PR.

---

## 6. Asset audit — corrected current finding

The repo **does contain official NOVA assets** at the current head:

- `public/ecosystem/agis/nova/icon.png` — ~567 KB;
- `public/ecosystem/agis/nova/logo.png` — ~1.12 MB.

`public/ecosystem/asset-map.json` identifies them as deterministic copies of the official transparent NOVA masters:

- `nova-logo-transparent-master.png`;
- `nova-isotype-transparent-master.png`.

This supersedes the earlier plan note that no NOVA asset existed in the repository.

### Asset policy for v1.1

- Prefer the existing official transparent **NOVA isotype/icon** for compact identity.
- Do not redraw or reinterpret it.
- Do not introduce the humanoid NOVA avatar in the dense mobile workspace; the current task has no UX justification for a portrait.
- Heritage/3D treatment is reserved for premium/splash moments, not dock/header controls.
- If the existing official PNG is larger than required for repeated 20–48px UI use, create a deterministic optimized delivery derivative from the official file during implementation (for example 128/256px WebP/PNG as appropriate), preserving transparency and design exactly.
- Do not add 1536px black-background source images to small controls.
- Hocker One chrome continues using Hocker One product assets; NOVA identity is used only where the element specifically represents NOVA.

---

## 7. Priority findings and required design

## P0.1 — GitHub action-chain outcome must be coherent

Introduce a derived presentation outcome independent of `nextAction`:

```ts
type GuidedChainOutcome =
  | "in_progress"
  | "completed"
  | "cancelled"
  | "failed";
```

Rules:

- `completed`: every required step has execution-success state (`executed`/`completed`).
- `cancelled`: no open step remains and at least one required terminal step is rejected/cancelled, with no failure taking precedence.
- `failed`: no valid continuation or a required step has failure/error evidence that requires recovery.
- `in_progress`: at least one non-terminal required step remains.

Copy must follow outcome, not infer completion from absence of `nextAction`.

Examples:

- all rejected → **Ejecución cancelada · 0 de 3 ejecutados**;
- all executed → **Cadena completada · 3 de 3 ejecutados**;
- one executed + one awaiting approval → **En progreso · 1 de 3 ejecutados**;
- terminal failure → **Requiere revisión**, with evidence/recovery action.

No stored action status is rewritten.

## P0.2 — Mobile dock must own one reserve contract

Define one authoritative shell variable/token representing:

`dock visual box + exterior breathing room + safe-area inset`.

Principles:

- `PrivateShell` consumes that token for mobile bottom padding.
- Dock wrapper consumes the same geometry without adding the safe-area inset a second time.
- Touch targets remain at least 44 CSS px; target ~48–54 px in the compact dock.
- Last focusable/interactive content must remain completely tappable above the dock at short Android viewport heights, standalone PWA and Capacitor wrapper sizes.
- No horizontal clipping.
- Desktop receives no dock reserve.

Do not solve this by adding a larger arbitrary `rem` value.

## P0.3 — Recursos status must report current truth

Define a human provider readiness model derived from existing registry evidence:

```ts
type ProviderReadiness =
  | "connected"
  | "configured"
  | "problem"
  | "pending";
```

Mapping:

- `connected`: connector state is connected and the latest initialization/health evidence is successful.
- `problem`: configuration exists **and** current connector/registry state contains `lastError` or failed initialization evidence.
- `configured`: configuration exists but there is no current successful connection proof and no current error proof.
- `pending`: required configuration is absent.

Human labels:

- connected → `Conectado`;
- problem → `Con problemas`;
- configured → `Configurado`;
- pending → `Pendiente`.

`Protegido` remains a separate governance boundary label for canonical integrations/modules, not an MCP health state.

Rules:

- `0 herramientas / 0 capacidades` after an init error never appears beside a healthy/prepared state.
- `lastError` is available in an expandable/detail diagnostic, not dumped as the main card headline.
- `configured` is not green.
- “Proveedores · Conectados” becomes neutral wording such as `Proveedores` / `Estado de proveedores` so the section does not presuppose success.

---

## P1.1 — NOVA runtime presentation and recovery

Do not alter raw backend status values. Derive a presentation state from raw service status + current request error:

- `online` — verified runtime answered.
- `checking` — no verdict yet.
- `offline` — explicit offline health state.
- `problem` — configured/unknown plus a current runtime error or failed health request.

UI behavior:

- Online: compact status, conversation and composer normally available.
- Checking: compact non-alarming verification state.
- Offline/problem: preserve existing conversation history; replace the large generic empty void with a compact recovery panel:
  - `NOVA sin conexión` or `NOVA requiere revisión`;
  - one-sentence cause in human language;
  - `Reintentar` control;
  - last verified time when present.
- Requests that require unavailable NOVA runtime remain fail-closed. The composer must explain why it cannot submit; no fake queued/success response.
- Owner Gate unreadable state remains locked (`can_start_new_task=false`).

The UI must not add a synthetic heartbeat.

## P1.2 — Heading and identity normalization

### Mobile

- Topbar owns the route title.
- Pulso/Recursos page headers should not visually repeat the same large title directly underneath. Keep one semantic `h1` in the document, but presentation can use a smaller contextual header or visually suppress duplicate chrome on mobile.
- `/chat`, `/owner/nova` and `/app/nova` must display **NOVA**, never `Chat`.

### NOVA workspace

- Remove the redundant full `NOVA` workspace heading from inside the chat header when Topbar already states NOVA.
- Keep a compact presence/status row using the official NOVA isotype plus status label/detail.
- The official avatar is not used in v1.1.

## P1.3 — Contrast and typography

Current readable copy frequently uses `text-slate-600` and `text-slate-700` on `#030711/#050b16/#07101f`, which is too weak for normal explanatory content.

Introduce/standardize three semantic roles:

- **Primary:** near-white for headings and critical values.
- **Secondary readable:** blue-gray equivalent to roughly slate-300/400 for descriptions, statuses and normal metadata users must understand.
- **Tertiary:** muted slate for optional timestamps/technical IDs only.

Disabled control text remains visually distinct from tertiary informational text.

Target WCAG AA for normal body/control copy. Decorative microcopy may be less prominent but cannot carry essential state alone.

## P1.4 — Recursos density

Default provider card:

- provider icon;
- provider name;
- readiness pill;
- one-line purpose;
- meaningful counts only if non-zero or if count absence itself matters.

Diagnostic detail:

- tools/capabilities;
- last check;
- last error summary;
- scopes/permissions when safe;
- authorized AGI relationships if already available from trusted data.

Do not create fake “install” or “import” controls.

## P1.5 — Floating control overlap

Previous screenshot review attributed the black right-edge floating control to **Vercel Preview Toolbar**, not Hocker One application chrome. The current audit found no Signal component corresponding to that visual control.

Therefore:

- do not move or redesign app UI to accommodate an assumed internal accessibility widget without evidence;
- during preview QA, record whether the overlay is Vercel-injected or application-owned;
- if it is Vercel Toolbar and it obstructs a visual capture, use supported Preview configuration for the QA branch rather than product CSS hacks;
- if fresh authenticated inspection proves an app-owned accessibility control exists, add it to the same safe-area collision test matrix before implementation.

## P1.6 — MCP logging/alert ownership

A single failed provider initialization should produce one correlated operational incident, not duplicate independent alerts.

Recommended boundary:

- connector: may return/throw structured diagnostic state and optionally one debug-level trace;
- registry: owns provider initialization failure error log and `alertMcpProviderDown` notification;
- UI: reads registry evidence; it does not trigger its own alert for the same attempt.

Do not suppress the underlying error. Deduplicate reporting, not evidence.

---

## 8. Accessibility requirements

Implementation must preserve or add:

- visible `:focus-visible` styling;
- minimum 44px interactive targets, with mobile primary targets aiming at 48px+;
- `aria-current="page"` on active persistent navigation;
- `aria-expanded`/labels on expandable controls;
- keyboard operation and focus management in Command Palette;
- explicit accessible label for icon-only refresh/send/voice controls;
- status/error announcements with a polite live region when state changes after user action;
- no state communicated by color alone;
- reduced-motion preference remains honored;
- no duplicate landmark/navigation labels that make the mobile shell ambiguous.

The contrast pass is part of accessibility, not cosmetic polish.

---

## 9. Client/server boundary requirements

Keep these boundaries:

- auth/session and Supabase server config stay server-side;
- secret/service-role keys never become public fallbacks;
- provider diagnostics with sensitive details remain server-side and are sanitized before rendering;
- `Recursos` may render registry status server-side, but page rendering should not become an uncontrolled repeated health-check/alert generator;
- mutation components remain clients only where interaction requires it;
- no new global client provider merely to solve local visual state.

For v1.1, prefer a minimal registry/readiness adapter over a large MCP architecture rewrite.

---

## 10. Performance requirements

- No 1536px/source-master image should be shipped directly into a 20–48px repeated control when a deterministic optimized derivative can be used.
- Use explicit image dimensions and avoid layout shift.
- Do not mark every brand image `priority`; only above-the-fold critical product chrome should preload.
- Do not add a new polling interval.
- If polling consolidation is implemented, prove no loss of freshness or Owner Gate state before replacing existing readers.
- Recursos should not serially block on provider timeouts; current registry initializes concurrently, which must be preserved if initialization remains in render flow.
- Keep `SignalBackdrop` lightweight; do not restore removed canvas/VFX layers.

---

## 11. Recommended implementation approaches considered

### Approach A — Semantic-first narrow polish **(recommended)**

- Add outcome/readiness presentation helpers.
- Fix dock reserve contract.
- Normalize headings/contrast/density.
- Integrate existing official NOVA isotype via optimized delivery asset if needed.
- Deduplicate MCP error ownership only where the current initialization path proves duplication.
- Leave larger polling/state architecture for later unless a very small shared primitive is demonstrably safer.

**Why:** lowest regression risk, directly addresses every observed defect and preserves auth/security/runtime boundaries.

### Approach B — Shared client store + broad shell refactor

Centralize navigation status, approvals, NOVA runtime, providers and polling into a new shared client store; rebuild shell around that.

**Rejected for #213:** too large, changes server/client boundaries, increases security/session regression surface and makes visual QA harder to isolate.

### Approach C — Visual-only CSS polish

Fix spacing, contrast and cards without changing readiness/outcome helpers.

**Rejected:** would leave false “Todo listo/Completado” and “Preparado” semantics in place. Cosmetic correctness is insufficient.

---

## 12. TDD implementation order — only after Owner approval of this spec

### RED 1 — Action-chain outcome

Add failing tests for:

- all rejected/cancelled → `cancelled`, 0 executed;
- all executed/completed → `completed`;
- failure terminal → `failed`;
- pending/approval → `in_progress`.

Then implement the smallest pure helper and update `GuidedGitHubChainCard` to consume it.

### RED 2 — Provider readiness

Add failing tests proving:

- configured + connected + no current error → connected;
- configured + `lastError` → problem;
- configured + no success/no error → configured;
- not configured → pending;
- failed configured provider cannot render `Preparado`/green.

Then implement a pure readiness mapper and compact Recursos UI.

### RED 3 — Mobile dock reserve

Add source/layout contract tests proving:

- one authoritative reserve token exists;
- `PrivateShell` consumes it;
- dock safe area is not separately double-counted;
- duplicate obsolete dock geometry rules are removed only after the new contract is in place.

Then verify manually on short/tall Android viewport, standalone PWA and Capacitor WebView.

### RED 4 — NOVA route title/offline presentation

Add tests proving:

- `/chat` resolves to NOVA title;
- offline/problem display exposes recovery action;
- offline/problem composer does not present a normal-send affordance;
- raw status is not upgraded.

### RED 5 — Contrast/hierarchy contracts

Prefer semantic class/token assertions over screenshot-literal tests:

- essential descriptions use secondary-readable token/class;
- tertiary token is limited to optional metadata;
- mobile header does not present duplicate large route title.

### RED 6 — MCP incident dedupe

If connector+registry duplicate reporting remains reproduced, add a test around one failed initialization resulting in one alert ownership path. Preserve diagnostic error state.

---

## 13. Verification matrix after implementation

### Automated

- targeted RED→GREEN tests for each changed semantic helper;
- complete existing test suite;
- TypeScript typecheck;
- lint;
- production build;
- dependency/security audit used by existing CI;
- GitHub CI on exact final head SHA.

### Preview/runtime

- exact final-head Vercel preview is `READY`;
- authenticated Owner login succeeds;
- wrong password fails safely and does not 500;
- Owner session reaches `/app/nova`;
- MFA/AAL2 escalation remains correct for protected action;
- NOVA online/checking/offline/problem states match evidence;
- no new runtime error cluster;
- `/app/recursos` reports Vercel/OpenAI/GitHub MCP failures as `Con problemas` when they still fail, never connected/prepared;
- if MCP endpoints are fixed separately and initialize successfully, UI may then show `Conectado` based on fresh evidence;
- one provider failure generates one incident/alert ownership path.

### Mobile/PWA/Capacitor

Test at minimum:

- narrow Android browser viewport;
- short-height Android browser viewport;
- installed standalone PWA;
- Capacitor Android WebView using the current remote server configuration;
- keyboard open/closed composer state;
- safe-area inset 0 and non-zero simulations where available.

Acceptance:

- final interactive content never sits behind the dock;
- no double safe-area gap;
- no horizontal clipping;
- Más and all three workspace tabs remain tappable;
- preview toolbar/other injected overlays are identified separately from product layout.

---

## 14. Security regression checklist

Before declaring #213 merge-ready:

- [ ] PR remains on the feature branch; no direct `main` write.
- [ ] Owner Gate mutation contracts unchanged or stricter.
- [ ] MFA/AAL2 tests pass.
- [ ] RLS/least-privilege tests pass.
- [ ] Supabase server alias/session regression tests pass.
- [ ] No secret/service-role key is imported into client code.
- [ ] No private response/page is added to service-worker cache.
- [ ] No new external provider is marked connected without runtime evidence.
- [ ] No raw provider secret/error payload exposing credentials is rendered.
- [ ] Action failure/cancel states cannot be displayed as completed.
- [ ] Dependency audit remains green.

---

## 15. Cleanup scope allowed in this PR

Allowed only after functional/semantic tests are green:

- consolidate duplicate bottom-dock CSS generations into the new single geometry contract;
- remove `.hko-bottom-dock-search-btn` if repo-wide reference check confirms it is unused;
- remove duplicate Signal-only styling that is proven superseded;
- remove obsolete import/reference code made unreachable by this PR.

Not allowed without separate evidence/review:

- deleting broad VFX/style modules merely because `PrivateShell` no longer imports them;
- splitting/rearchitecting the entire 4k+ line master stylesheet;
- replacing all polling with a new state framework;
- replacing MCP transport architecture;
- changing global brand assets.

---

## 16. Explicit non-goals

- No merge to `main` in this implementation workflow.
- No production Supabase DDL/grant/RLS migration.
- No credential rotation.
- No `allow_actions` expansion.
- No repository allowlist expansion.
- No NOVA avatar redesign/generation.
- No Heritage logo in compact chrome.
- No fake attachment/import/install feature.
- No redesign of Hocker One logo.
- No new application shell framework.

---

## 17. Final acceptance definition

Signal v1.1 is ready for human merge only when all of the following are simultaneously true on the same final head SHA:

1. NOVA · Pulso · Recursos · Más remains the persistent mobile IA.
2. The action chain never calls a cancelled/failed workflow completed.
3. Recursos labels reflect current MCP evidence; a configured provider with a current init error is `Con problemas`.
4. NOVA offline/problem state is compact, recoverable and fail-closed.
5. The mobile dock never overlaps the last actionable content in browser, PWA or Capacitor.
6. Secondary readable text meets the agreed contrast standard.
7. Route/page title hierarchy is not duplicated on mobile; legacy `/chat` presents as NOVA.
8. Only official NOVA assets are used, with no avatar and no unnecessary source-size payload in compact controls.
9. Owner Gate, Supabase session, MFA/AAL2, RLS, PWA private-cache policy and deep links remain intact.
10. Targeted tests, full tests, typecheck, lint, build, CI and dependency audit are green.
11. Exact final preview is READY and authenticated Owner E2E passes.
12. `/app/recursos` runtime health/status semantics are explicitly reverified after the final deployment.
13. PR #213 remains draft until this evidence is reviewed by the Owner.

---

## 18. Self-review notes

This design intentionally resolves the main ambiguities before implementation:

- **NOVA assets:** current repo inspection supersedes the older “missing assets” note; official transparent NOVA logo/isotype files already exist under `public/ecosystem/agis/nova` and are mapped to official masters.
- **Floating control:** there is not enough current source evidence to classify the screenshot overlay as an app accessibility control; prior evidence identifies Vercel Preview Toolbar. The implementation must verify ownership before changing product layout.
- **MCP 404s:** treated as proven prior authenticated-preview evidence but not falsely reported as freshly reproduced after log retention expired.
- **Configured vs connected:** explicitly separated.
- **Cancelled vs completed:** explicitly separated.
- **Safe area:** one geometry owner; no larger magic padding workaround.
- **Scope:** semantic correctness and targeted polish only; no broad architecture rewrite.

No implementation work should begin until the Owner reviews and approves this committed spec.