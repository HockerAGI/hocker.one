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

**Audit chain — signed, append-only, REALLY verified (durable):**
- Rows are HMAC-signed AND the chain is persisted (seq/prev_hash/row_hash/signature cols added by migration supabase/migrations/20260612_103000_audit_chain_signatures.sql). verifyAuditChain recomputes each row signature + prev_hash linkage; legacy rows (signature null) are counted, not failed. (Previously verify only recomputed a virtual chain → false security; fixed.)
- DEPLOY ORDER (hard): apply the migration on Supabase BEFORE deploying code — new code reads/writes the new columns and errors if absent. Migration drops audit_logs FK cascades (on-delete-set-null, so deleting a project/user keeps signed rows intact) and adds triggers that BLOCK update/delete (append-only) even for the service role. Secret: HOCKER_AUDIT_SECRET (fallback SUPABASE_SERVICE_ROLE_KEY).
- GOTCHA (cost a review cycle): when signing/hashing a row that includes a Postgres `timestamptz`, the signed `new Date().toISOString()` ("…Z", ms precision) is re-serialized by PostgREST on read as "…+00:00" with trimmed fractional zeros → recomputed hash mismatches → ALL rows read as invalid. Fix: canonicalize the timestamp via `new Date(value).toISOString()` on BOTH the sign and verify paths (canonicalTimestamp in audit-chain.ts). Applies to ANY future signed/hashed timestamp column.

**Orchestrator internal auth (consistency rule + footgun):**
- /api/orchestrator/run validates `HOCKER_ONE_INTERNAL_TOKEN ?? CRON_SECRET`. ANY internal caller that forwards to it (cron, commands, commands/approve) MUST forward that same precedence in the Bearer header, or it silently 401s when the two secrets differ. External cron entry still authenticates with CRON_SECRET. (cron route was forwarding raw CRON_SECRET → fixed.)
- FOOTGUN: ORCHESTRATOR_BASE_URL is dual-purpose — cron uses it as the base for the app's OWN /api/orchestrator/run, but hocker-provider-orchestrator.ts uses it as the external NOVA AGI (Railway) URL fallback. Setting it to Railway breaks the cron self-forward. Leave UNSET on Vercel (origin fallback) or point it at the Vercel app itself.

**Resolved this session (no longer "islands"):**
- Jurix Fastify island ported to Next routes under src/app/api/jurix/audit/* (auth via requireOwnerOrInternal, zod on log body); dead src/routes/jurix.ts + src/lib/http.ts deleted and the unused `fastify` dep removed.
- system/security-hardening & system/tenant-rls endpoints: KEPT per owner decision (do NOT delete); pages /security/hardening & /security/rls exist.

**Cross-repo alignment (3 siblings: hocker.one / nova.agi / hocker-node-agent):**
- Integration glue is SHARED Supabase tables (commands, audit_logs, events) + identical HMAC command-signing — NOT HTTP for commands. Audit is now the ONE exception (HTTP, see below). hocker.one→nova.agi DOES use HTTP for /providers/status (Bearer NOVA_ORCHESTRATOR_KEY).
- AUDIT SEALING IS CENTRALIZED IN hocker.one (owner decision): hocker.one is the SINGLE writer to the tamper-evident chain. nova.agi's `auditCriticalAction` (src/lib/jurix-hook.ts) POSTs to hocker.one `POST /api/jurix/audit/log` (Bearer NOVA_ORCHESTRATOR_KEY) instead of inserting audit_logs directly; it keeps the `events` insert direct (events is NOT the chain). **Why:** single writer avoids seq-collision forks between services on the (project_id,seq) unique index.
  - Gate `requireOwnerOrInternal` accepts NOVA_ORCHESTRATOR_KEY / HOCKER_ONE_INTERNAL_TOKEN / HMAC secrets as Bearer — so NOVA authenticates with its own orchestrator key, no new secret needed.
  - CAVEAT: `auditCriticalAction` has NO callers in nova.agi yet (dormant contract; takes effect when NOVA code starts invoking it).
  - PROD CONFIG the owner must set: nova.agi Railway HOCKER_ONE_API_URL=real hocker.one URL (now guarded in prod via superRefine — boots-fail instead of per-audit-fail) + NOVA_ORCHESTRATOR_KEY; hocker.one/Vercel same NOVA_ORCHESTRATOR_KEY + HOCKER_AUDIT_SECRET (else falls back to SUPABASE_SERVICE_ROLE_KEY).
- Command-signing canonical-JSON null edge: hocker.one `stableStringify(null)`→`"null"` vs siblings→`"{}"`. NEVER triggered (every signer defaults payload to `{}`). Do NOT "fix" hocker.one's stableStringify — it ALSO feeds audit row_hash, so changing null handling would silently change audit hashes.
- `_external/nova.agi` & `_external/hocker-node-agent` are shallow clones WITHOUT their own `.git` (git commands there read the PARENT hocker.one repo, where `_external/` is gitignored → empty diff/status). To recover an original file, fetch GitHub raw (repos are public). Edits made here must be pushed by Armando from HIS OWN clones; they never appear in hocker.one's Git pane.

**Cannot verify from Replit (owner's domain):** Supabase remote-vs-local migration drift (docs/ops/supabase-remote-vs-local-baseline-report.md); live needs_approval→approved→executed flow (runs on Railway/Vercel). Auth in that flow is code-consistent (requireProjectRole; owner-only on decision/execute).
