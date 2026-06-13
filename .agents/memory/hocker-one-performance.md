---
name: HOCKER ONE performance
description: Load-time architecture decisions and the no-preview redesign workflow for the Next.js app.
---

# Performance & redesign workflow

## Code-splitting (the app shipped with zero next/dynamic)
Root `layout.tsx` wraps every route in `ShellFrame`. Keep `ShellFrame` thin: it
only decides public-vs-private and lazily renders the private shell via
`next/dynamic`. The private shell (sidebar/topbar/dock/background + canvas VFX)
lives in its own chunk so public/marketing/SEO routes never download it.
**Why:** before this, the private-shell JS shipped to public routes too, and the
86-particle canvas + ~1350-line chat were eagerly bundled — that was the "slow to
load" the owner felt.
**How to apply:** browser-only / decorative / very large components (canvas VFX,
realtime chat) → `dynamic(..., { ssr: false })` with a skeleton. Server-rendered
SVG/CSS components (e.g. EcosystemVfxNetwork) are NOT heavy — do not wrap them,
you'd only lose SSR.

## globals.css
~4546 lines, imported in root layout → parsed on every route (incl. public).
**Why:** four stacked "systems" with live + dead rules intermixed.
**How to apply:** do NOT blind-split or bulk-delete. Only `.hko-vfx-*` selectors +
non-final `--hko-*` tokens are safely dead. Reduce duplicate/dead rules first, or
scope NEW redesign surfaces to CSS modules/tokens.

## Redesign workflow (cannot preview the running app)
Replit is edit-only; owner deploys on Vercel; I cannot run/screenshot the live app.
**Why:** owner hard constraint + he wants to SEE the redesign before it lands.
**How to apply:** prototype redesign surfaces in an isolated canvas/mockup sandbox
(static data, no prod runtime), get owner sign-off via screenshots, then graduate
one route-family per deploy. Validate logic with `tsc --noEmit` (full `next build`
does not converge in this env).
