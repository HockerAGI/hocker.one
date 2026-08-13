# Hocker One Platform Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize Hocker One, NOVA and the 16 AGIs as a secure, low-noise private control plane across web/PWA/Android/iOS, preserving Owner Gate and existing production behavior while removing verified technical and UX debt.

**Architecture:** Keep Hocker One as the governed modular control plane and NOVA as the reasoning/orchestration runtime. Do not move material execution into chat or mobile clients. Changes are split into small PRs: private-read auth, framework/tooling alignment, shell/PWA simplification, iOS build readiness, and AGI evidence freshness/evaluation gates.

**Tech Stack:** Next.js 16.x App Router, React 19.2.x, Node 22, TypeScript, Supabase/Postgres/RLS, Fastify NOVA runtime, Capacitor 8, GitHub Actions, Vercel.

## Global Constraints

- Preserve `allow_actions=false` for every AGI; all material writes remain governed by Hocker One Owner Gate.
- Never expose service-role keys, provider secrets, Owner action keys, or internal service keys to browser/mobile bundles.
- Keep Android `compileSdkVersion=36` and `targetSdkVersion=36`; do not add permissions without a concrete product requirement.
- iOS work must be build-ready with Xcode 26 / iOS 26 SDK compatibility, but signing and App Store submission remain external Owner gates.
- No real-money Chido activation, payment enablement, destructive automation, force pushes, branch-protection bypasses, or `--legacy-peer-deps`.
- Keep the current Hocker One brand assets and identity; simplify navigation/chrome rather than redesigning logos.
- Preserve private PWA policy: authenticated pages and API responses are never persisted by the service worker.
- Every behavior change uses TDD: failing regression first, minimal implementation second, full CI third.
- Every production merge must be tied to the exact reviewed head SHA, Vercel deployment evidence, smoke checks, and rollback candidate.

---

### Task 1: Session-authenticated private system status

**Files:**
- Create: `src/lib/private-session-api-gate.ts`
- Modify: `src/app/api/system/status/route.ts`
- Modify: `src/components/HealthIndicator.tsx`
- Modify: `src/lib/cors.ts`
- Test: `tests/system-status-session-gate.test.mjs`

**Interfaces:**
- Consumes: existing `validateHockerOwnerApiGate(request)` and `createServerSupabase()`.
- Produces: `requirePrivateReadApi(request, projectId?)` returning authenticated `owner|admin|operator|internal` or a fail-closed response.

- [ ] **Step 1: Write the failing regression test**

Create `tests/system-status-session-gate.test.mjs` asserting that `/api/system/status` requires `requirePrivateReadApi`, browser `HealthIndicator` does not read/send `__HOCKER_OWNER_KEY` / `x-hocker-owner-key`, the private gate accepts only internal service identity or authenticated project membership, and default CORS excludes secret gate headers.

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `node --test tests/system-status-session-gate.test.mjs`
Expected: FAIL because `src/lib/private-session-api-gate.ts` does not exist and current status route still uses the Owner-key gate.

- [ ] **Step 3: Implement the minimal private-read gate**

Create a server-only helper that accepts a validated `internal` identity or a Supabase session whose `project_members.role` is `owner`, `admin`, or `operator`. Return 401 for missing session, 403 for missing role, and 503 when the session gate is unavailable.

- [ ] **Step 4: Remove browser shared-secret fallback**

Make `HealthIndicator` perform same-origin session-authenticated fetch without custom secret headers. Remove Owner/Internal secret headers from the default CORS allowlist.

- [ ] **Step 5: Verify GREEN and full CI**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=high`.
Expected: all pass.

### Task 2: Align the Next.js package family

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/next-package-family.test.mjs`

**Interfaces:**
- Consumes: current React 19.2.8 and Next.js 16.x app code.
- Produces: one stable Next package family with `next`, `eslint-config-next`, and `@next/eslint-plugin-next` on the same 16.3.x release line.

- [ ] **Step 1: Add a regression test for package-family alignment**

Read `package.json` and assert the three Next-family package versions resolve to the same `16.3` major/minor line and no canary/preview tag is present.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/next-package-family.test.mjs`
Expected: FAIL because `next` and `@next/eslint-plugin-next` are 16.2.x while `eslint-config-next` is 16.3.x.

- [ ] **Step 3: Upgrade the family together using the lockfile**

Use npm without force/legacy peer overrides so `next`, `eslint-config-next`, and `@next/eslint-plugin-next` are updated together. Do not change React unless npm requires a compatible stable version and the change is independently reviewed.

- [ ] **Step 4: Verify install/build/audit**

Run the full CI sequence plus Android debug build to catch framework/WebView regressions.

### Task 3: Remove duplicated shell navigation without losing capabilities

**Files:**
- Modify: `src/components/PrivateShell.tsx`
- Modify: `src/components/Topbar.tsx` only if required to preserve workspace access.
- Modify: `src/components/WorkspaceBar.tsx` only if it becomes an on-demand surface.
- Test: `tests/private-shell-information-architecture.test.mjs`

**Interfaces:**
- Consumes: `HOCKER_NAVIGATION`, Sidebar desktop navigation, BottomDock mobile navigation, command palette.
- Produces: one primary navigation per breakpoint plus compact context; all existing routes remain addressable.

- [ ] **Step 1: Add a regression test encoding the simplified shell**

Assert that desktop shell renders Sidebar + Topbar, mobile retains BottomDock, CommandPalette remains available, and persistent `ContextNav` + `WorkspaceBar` are not simultaneously mounted ahead of every page.

- [ ] **Step 2: Verify RED**

Run the targeted test and confirm current `PrivateShell` fails because it mounts both contextual surfaces.

- [ ] **Step 3: Make the minimal composition change**

Remove duplicated always-on chrome while preserving route discovery in Sidebar/BottomDock/CommandPalette and retaining project/node controls through a compact/on-demand entry point if no equivalent already exists.

- [ ] **Step 4: Verify desktop/mobile accessibility and no route loss**

Run tests/build and inspect navigation data to ensure every canonical route remains reachable.

### Task 4: PWA update lifecycle and privacy-safe caching

**Files:**
- Modify: `src/components/PwaRegister.tsx`
- Keep: `public/sw.js` private-cache policy unless a test proves a defect.
- Test: `tests/pwa-lifecycle.test.mjs`

**Interfaces:**
- Consumes: existing `hocker:pwa-*` custom events and `/sw.js` registration.
- Produces: observable service-worker update lifecycle without caching authenticated application responses.

- [ ] **Step 1: Add a failing test for update detection**

Assert registration listens for an installed waiting worker / controller change and emits a stable update-available event; assert service worker still bypasses `/api/` and never stores successful authenticated navigations.

- [ ] **Step 2: Implement minimal update notification state/event**

Do not force reload while an Owner may be reviewing an action. Surface an explicit update signal and reload only on user action or a safe next launch.

- [ ] **Step 3: Re-run PWA privacy regressions and build**

### Task 5: iOS build readiness without premature store claims

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create/modify: iOS Capacitor project files generated by the pinned Capacitor 8 CLI if committed by the repository policy.
- Create: `.github/workflows/ios-build.yml`
- Test: `tests/mobile-platform-readiness.test.mjs`

**Interfaces:**
- Consumes: `capacitor.config.ts` app identity `com.hocker.one` and remote HTTPS application URL.
- Produces: reproducible unsigned iOS compile gate on macOS, with no production signing material in GitHub.

- [ ] **Step 1: Add a failing readiness test**

Assert `@capacitor/ios` is pinned to the same version as Capacitor core/CLI, iOS scripts exist, and an iOS CI workflow builds without signing.

- [ ] **Step 2: Add the iOS platform and workflow**

Use the pinned Capacitor version. Do not add camera/location/microphone/contacts permissions. Build with Xcode 26-compatible settings and `CODE_SIGNING_ALLOWED=NO` in CI.

- [ ] **Step 3: Verify web/PWA/Android remain green**

Run full CI and Android pipelines; iOS CI must pass independently before any store-signing work.

### Task 6: Freshness/evaluation gates for NOVA and all 16 AGIs

**Files:**
- Inspect first: NOVA runtime manifests/evals/prompts and Hocker One scheduler/source-refresh code.
- Create/modify only after a failing test identifies the missing freshness gate.
- Test: AGI source/memory freshness, eval readiness, and tool-readiness regressions.

**Interfaces:**
- Consumes: `agi_update_sources`, `agi_memory_mirror`, `agi_agents`, tool bindings, run/eval evidence.
- Produces: a deterministic readiness/freshness score that distinguishes `profile configured`, `source stale`, `eval ready`, and `worker verified`; it does not fabricate new memories or enable material tools.

- [ ] **Step 1: Audit current source polling, eval suites and scheduler code**

Map exactly which AGIs have real source checks/evals and which only have catalog rows.

- [ ] **Step 2: Add failing contract tests for freshness/readiness**

Require each AGI to expose source freshness, eval status, enabled-tool evidence, and last verified run without converting stale catalog state into `live`.

- [ ] **Step 3: Implement the smallest missing scheduler/readiness pieces**

Use official-source candidates and review gates; never write unreviewed web content directly into canonical AGI memory.

- [ ] **Step 4: Verify the 16-AGI matrix**

Require all 16 identities to be present with accurate status and explicit blockers. Only promote a status when execution/eval evidence meets the canon.

### Task 7: Release evidence and production closeout

**Files:**
- Update only evidence/runbook documents generated by each merged PR.

**Interfaces:**
- Consumes: exact merged SHAs, CI runs, Vercel deployment IDs, mobile build artifacts, Supabase advisor results.
- Produces: reproducible release evidence and explicit external gates.

- [ ] **Step 1: Merge each independently green PR with expected-head SHA protection**
- [ ] **Step 2: Smoke the production login/control-plane routes and confirm fail-closed private APIs**
- [ ] **Step 3: Re-run Supabase security advisors and authorization probes**
- [ ] **Step 4: Record only remaining external gates: Apple/Google signing/store accounts, credential rotations requiring provider ownership, and regulated/legal launches**
