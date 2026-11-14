# Hocker ONE — UX route, deployment, Owner Gate and official brand reconciliation

**Date:** 2026-11-14 (America/Tijuana)
**Scope:** `HockerAGI/hocker.one` private control plane. NOVA runtime and Node Agent inspected only as dependencies.
**Baseline:** `main=1ab05ea7264d78c5a3119cf6792c297d3ba8a8b6`; Vercel Production `dpl_4ZeksMzLwgVUJjf6cJBnmfnEg9Uc` READY at the same commit. No unreviewed production mutation.
**Truth priority:** authenticated production behavior > exact deployed source > database permissions and data > reviewed UX contract / DOC-08 > historical notes.

## 1. Navigation audit — actual source vs promised UX

| Intended experience | Before change | Change in this PR | Release acceptance |
| --- | --- | --- | --- |
| Owner approvals under Trabajo | `hocker-navigation.ts` linked `/owner/actions`, but `next.config.ts` redirected it to `/commands` and the owner/actions source was only a placeholder using an extra legacy shell | Remove redirect; use existing `OwnerApprovalCenter` with server-side `requireOwnerAal2Page`, no duplicate OwnerShell | Non-owner denied; Owner AAL1 goes to current MFA with safe return URL; AAL2 sees true action data; no mock actions |
| Context Bridge | `/owner/context-bridge` exists and has an AAL2 gate, but its route is absent from navigation | Add `Más → Continuidad`; preserve server auth | Desktop sidebar and mobile context nav expose deep link, Owner still needs fresh MFA |
| Work on mobile | Mobile dock lands on `/commands` with no visible way to Owner approvals | Add explicit `Revisar aprobaciones` link and context navigation row | 360–430 px keyboard/tap target / focus QA needed |
| More on mobile | Mobile dock points to Seguridad; detailed secondary nav was not rendered anywhere | Reuse existing `ContextNav` inside compact non-immersive shell; no new menu hierarchy | Continuidad, Evidencia, Reglas and Seguridad discoverable |
| Home | Eight repeated quick links plus main nav, confusing operational priority | Four task-oriented shortcuts: Aprobaciones, Continuidad, AGIs, Conexiones | All former destinations remain available through existing navigation/search/deep links |
| Approval shortcuts | Topbar and Home approved/rejected inline without the complete scope or rollback context | Both surfaces become read-only entrypoints to Owner AAL2 approval center | No inline material decision APIs outside the protected review page |
| Approval read outage | Dashboard silently treated unreadable action API as empty list and showed `Limpia` | Explicit `Sin verificar` error state | No false empty-queue status |

## 2. Official identity

- Repository source of truth: `public/ecosystem/asset-map.json`.
- **Official horizontal logo:** `public/ecosystem/apps/hocker-one/logo.png`; source `LOGOS APPS/HOCKER ONE/01_logo_horizontal/.../hocker-one-logo-transparent-master.png`.
- **Official isotype:** `public/ecosystem/apps/hocker-one/icon.png`; source `LOGOS APPS/HOCKER ONE/02_isotype_icon/.../hocker-one-isotype-transparent-master.png`.
- Before this change, the desktop sidebar displayed `/brand/hocker-one-logo.png`, which is a **square 500×500 PNG**, constrained to a narrow 144×40 box even though the actual official horizontal asset exists. The proper master wordmark is a landscape image. Mobile header and Owner home used a generic icon/text rather than the official isotype.
- New use: official wordmark in desktop sidebar, official isotype in mobile header and Owner home. Preserve source asset bytes/proportions, no AI redraw or fake official art. PWA icon files remain as-is; their changes require a separate image QA check.

## 3. Preserve source of truth and live security

- `OwnerApprovalCenter` consumes authenticated `/api/agi/runtime/actions` and submits decisions via the existing API, where approvals require real Owner AAL2. This PR **does not** add a bypass, preload approvals or fabricate action records.
- `ContextBridgeActivationPanel` continues to invoke the existing server-controlled activation path and its six-provider coverage gate. The navbar is an entrypoint only, not proof of coverage or activation.
- Supabase checkpoint at this UX audit: 16 canonical AGIs, `allow_actions=false` across all, 14 old `agi_tasks` queued/pending (not approval queue), and 0 new Owner approval evidence. Older task records are separate from `agi_action_queue`; **never show “14 approvals pending”**.
- The dedicated `nova.agi` process / `hocker-node-agent` do not have a fresh verified heartbeat. Their labels in UX must not be painted “online” solely from rows or docs.
- Cloudflare coordinator is a verified read-only observer, **not** a dedicated 24/7 AGI executor; leave Cron and secrets untouched in this UI PR.

## 4. Clean-up scope and boundaries

**Removed from primary exposure:** duplicate quick actions, unsafe inline approval decisions, unreachable Owner approval alias, incorrect shell/branding in Owner actions.

**Intentionally retained:** `/commands`, `/owner/actions`, `/owner/context-bridge`, `/owner/evidence`, `/workers`, `/nodes`, `/map`, `/security`, `/governance`, `/integrations`, all deep links, monitoring, evidence tables, project scope. Obsolete components/routes are not deleted until an exact dependency graph and migration review establishes zero consumers.

**Remaining UX debt:** multiple UI components independently poll the same pending-action count; fix with a single provider/event source after measuring authenticated UI behavior. No whole-shell VFX rewrite here.

## 5. Release gates and limitations

1. Unit/contract tests, TypeScript, lint, production build, security/audit and exact-head Preview must pass. Review branch diff for unrelated changes.
2. Production deploy **automatically from reviewed main only**; never initiate a parallel production deployment. Confirm exact SHA + aliases.
3. Owner AAL1 negative path; Owner AAL2 sees queue; test pending, empty and failure states on desktop + mobile. Confirm that no inline quick approval POST is issued.
4. Context Bridge deep link to real MFA, six-provider checkpoint conditions and explicit owner approval unchanged. **Do not activate without coverage evidence.**
5. Verify the two official PNGs render without stretching and with proper contrast/sizing at 360, 768, 1024 and 1440 px. An authenticated visual-browser/device audit is still required: no claim of pixel-perfect certification from static source.
6. Run after-release error and Lighthouse/keyboard/accessibility smoke checks; rollback to previously verified Production if navigation/auth breaks.

Canonical guidance: DOC-03 Hocker One modules, DOC-05 Owner as material-action control plane, DOC-08 sections 15, 18–19, 34 and 39; approved `docs/superpowers/specs/2026-08-19-hocker-one-ux-limpia-design.md`.
