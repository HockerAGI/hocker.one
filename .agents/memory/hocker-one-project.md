---
name: HOCKER ONE project
description: Nature, hard constraints, and diagnostic baseline of the imported hocker.one repo
---
- Repo: HockerAGI/hocker.one — real, mature Next.js 16 App Router app. npm (package-lock), engines node 22.x. Stack: Supabase (auth+RLS), GitHub action gateway for NOVA, Trigger.dev, Langfuse, Capacitor/Android, NOVA engine on Railway.

**Hard constraints (from owner "Armando"):**
- Replit is ONLY for editing / cleaning / fixing / connecting code. He deploys & runs on Vercel himself — never run or migrate the app in Replit.
- Do NOT migrate to Replit's stack. Respect the existing Next.js/Vercel/Supabase/GitHub setup exactly.
- Do NOT build the external platforms described in the PDFs (Cloud Run, Hetzner, Cloudflare, Neo4j, GPT-5, etc.) — PDFs (attached_assets/AGIs_unificadas.txt, APPS-WEBS_UNIFICADAS.txt) are vision/ecosystem only.
- NO simulations / fake processes — 100% real. If in doubt, ASK directly, don't guess.

**Intentional safety boundaries — NOT bugs to remove:**
- Global beta-privada execution lock `real_execution_enabled=false`.
- `HOCKER_GITHUB_EXECUTION_MODE=mock` in src/lib/agi-action-execution.ts (defaults to `real`; opt-in test boundary).
**Why:** owner is extremely sensitive to scope creep and fake behavior; misreading these as defects breaks trust.

**Lint/build notes (durable):**
- `eslint .` is misleading — it ALSO lints `.local/skills/` (Replit env templates), not just the app. Always filter to app paths (exclude `.local/` and `docs/archive/`) before counting app errors/warnings.
- `eslint.config.mjs` deliberately sets set-state-in-effect → 'warn' and no-unused-vars → 'warn' (^_ allowed); no-explicit-any → 'error'. Do NOT force-fix the deliberate 'warn' rules.

**Islands to connect (kept on purpose, owner to wire — do NOT delete):**
- src/routes/jurix.ts + src/lib/http.ts = disconnected Fastify island (no entrypoint; `fastify` dep unused). Fastify cannot run on Vercel — needs an adapter or a port to a Next route. When connecting, add zod validation on actor_type/severity body fields (currently only cast, not runtime-validated).
- audit-chain.ts: rows ARE signed (signAuditRow used) but verifyAuditChain validates only the VIRTUAL hash chain — it never calls verifyAuditRow, so `/verify` is NOT cryptographic-signature-verified. The unused imports crypto/canonicalJson/verifyAuditRow are intentional connect-breadcrumbs.
- Endpoints system/security-hardening & system/tenant-rls appear caller-less though pages /security/hardening & /security/rls exist (connect-or-delete decision pending owner).

**Cannot verify from Replit (owner's domain):** Supabase remote-vs-local migration drift (docs/ops/supabase-remote-vs-local-baseline-report.md); live needs_approval→approved→executed flow (runs on Railway/Vercel). Auth in that flow is code-consistent (requireProjectRole; owner-only on decision/execute).
