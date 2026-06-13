---
name: HOCKER ONE design system
description: Durable design/typography/icon decisions for the HOCKER ONE Next.js app (premium dark UI).
---

# HOCKER ONE — design system constraints

## Typography (committed)
- Brand font is **Inter**, loaded via `next/font/google` in `src/app/layout.tsx` exposing `--font-inter` on `<html>`.
- **Why:** Before this, NO font was loaded at all (no `next/font`, no `@font-face`). `var(--font-dm-sans)` was undefined and a later rule set bare `Inter` (not loaded), so the app silently rendered system fonts and the APK forced `Arial` — that was the real cause of the "generic/basic" feel. Agreed direction is "Linear × Apple / Inter".
- **How to apply:** All `body` font-family rules and the mobile (`<=768px`) override must resolve to `var(--font-inter)`. Never reintroduce bare family names or `Arial`. `globals.css` has 3 competing `body` font rules (cascade — the last one wins); keep them all on `var(--font-inter)`.

## Mobile / APK performance (owner hard requirement)
- `globals.css` `@media (max-width:768px)` intentionally forces `box-shadow/backdrop-filter/transform/animation/filter: none`.
- **Why:** Owner uses the Android APK (Capacitor WebView) and requires "fast > fancy / sin lag". Heavy effects (especially `backdrop-filter` blur + animations) cause jank there.
- **How to apply:** Do NOT re-enable heavy effects on mobile to make it "premium". Elevate the mobile/APK feel through typography, color, and rounded radii (cheap), not blur/shadow/animation.

## App icons (PWA + APK)
- Icons are generated from `public/brand/hocker-one-isotype.png` (blue squircle "h") on a pure-black `#000000` background, via `sharp`. The isotype's own bg is `#000000` (sampled).
- The Android launcher icons were previously the **default Capacitor placeholder** — always verify they are the isotype, not the generic mark.
- Adaptive bg color resource (`android/.../values/ic_launcher_background.xml`) is `#000000` to match the foreground seamlessly.
- **How to apply:** After any icon change, the owner must **rebuild/reinstall the APK** and **reinstall/update the PWA** to see it — installed launcher icons are cached by the OS (not a code bug).
