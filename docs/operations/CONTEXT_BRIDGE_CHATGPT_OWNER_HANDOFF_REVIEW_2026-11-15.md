# ChatGPT Owner AAL2 handoff review (2026-11-15)

## Verified design

Reuses existing Context Bridge RPC and checkpoint/capability tables, not a second memory or new provider. The authenticated Owner AAL2 browser can POST an explicit GitHub #306 handoff URL at `/api/context-bridge/chatgpt/handoff-review`. Backend confirms same HTTPS origin, strict `confirm=true`, reads the specific issue comment via existing GitHub token, checks exact issue/canonical URL and GitHub `main` SHA, hashes the comment transiently, and stores a bounded normalized description and references only (never raw transcript, comment body, PII or secrets). GET reports the most recent review only to Owner AAL2.

## Important limitation

**An authenticated GitHub comment and Owner MFA are not proof of a provider-issued ChatGPT session identity.** The specialized route can write only `partial` for `chatgpt.normalized_handoff` and `chatgpt.project_context.read`. Cursor must say `chatgpt_provider_session_attested=false`. A fresh time stamp is **not** evidence that ChatGPT became verified, and returned `coverage_upgraded` and `manifest_activated` must remain `false`. The prior historical checkpoint is not overwritten. Existing RPC content hash deduplicates exact retries.

Codex and Google Drive remain P0. Codex needs real workspace/session review and Google Drive needs an approved current canonical corpus; Owner explicitly said both are pending. Current certified coverage 3/6 and historical active manifest without approval must remain untouched. No new Cron, token, model consumption, task execution or SQL/DDL.

## Acceptance criteria

- Candidate CI regressions/TS/lint/build/audit, CodeQL and exact-head Preview READY before protected merge.
- Production READY+main SHA, then Owner manually opens `/owner/context-bridge` and reviews an actual linked #306 comment. POST cannot be called from here without the Owner AAL2 browser session.
- Verify Supabase new `chatgpt-hocker-project-handoff` checkpoint's `cursor.review_type=owner_mfa_aal2_github_crosschecked`, status `partial`, no manifest promotion, no false 4/6.
- Do not flip any ChatGPT capability to `verified` until an independent session/provider attestation mechanism is available and tested.