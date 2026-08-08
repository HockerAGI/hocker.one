# HOCKER Plugin/Connector Hardening Execution — 2026-08-08

Status: **CONDITIONAL NO-GO — production frozen**

## Supabase Owner Gate validation

The paid Supabase Branch feature was unavailable on the current plan. Instead, the pre-existing validation project `pswlloziztxjsjazfiiy` was reactivated temporarily, used as an isolated sandbox, and paused after validation.

A minimal Hocker One fixture was created only in that sandbox and the migration `20260807_hocker_one_commands_owner_gate_hardening.sql` was applied there. Authorization/RLS evidence:

- owner: allowed to mutate `public.commands`.
- admin: allowed to mutate `public.commands`.
- operator: denied by RLS (`42501`).
- member: denied by RLS (`42501`).
- helper `private.is_project_owner_or_admin(uuid)`: owner/admin `true`; operator/member `false`.

The temporary Hocker One tables/functions were removed after validation. No production DDL was executed.

The validation project still contains pre-existing drift `public.validation_settlement_marker`: RLS disabled, zero rows, broad anon/auth grants, and no source occurrence found in the Chido repository. The project was paused; this drift must be removed or represented by a versioned migration/policy before the sandbox is used again.

## Security reviews

Connector-assisted Codex Security reviews were persisted on the five hardening branches. The installed methodology was followed for assets, trust boundaries, authorization, sensitive operations, controls, findings and coverage. The native Codex Security worker/scan-ID runtime was not exposed in this ChatGPT environment, so these reviews must not be represented as native sealed Codex Security scans.

- Hocker One: `docs/security/CODEX_SECURITY_REVIEW_2026-08-07.md`
- NOVA: `docs/security/CODEX_SECURITY_REVIEW_2026-08-07.md`
- Hocker Node Agent: `docs/security/CODEX_SECURITY_REVIEW_2026-08-07.md`
- HOCKER web: `docs/security/CODEX_SECURITY_REVIEW_2026-08-07.md`
- Chido Casino: `docs/security/CODEX_SECURITY_REVIEW_2026-08-07.md`

Residual defensive note: `shell.exec` in Hocker Node Agent is host shell execution with a sanitized environment, not a true OS sandbox. It remains disabled by default and requires the explicit break-glass flag `HOCKER_ALLOW_UNSANDBOXED_SHELL=true`; treat it as R4 and never as a normal NOVA capability.

## Android emulator QA

Hocker One now includes `.github/workflows/android-emulator-qa.yml` and `tests/android-emulator-qa.test.mjs` for API 36 emulator installation/launch QA on public GitHub runners. The workflow builds the debug APK, boots an API 36 emulator, installs and launches `com.hocker.one`, captures screenshot/UI tree/logcat/activity evidence, and fails on app crash evidence. It uses SHA-pinned GitHub Actions and no paid device farm.

At the time of this checkpoint the latest emulator job was still running; CI, Android Debug APK and temporary-signed Android release checks were green. Production Android signing remains intentionally unavailable.

## Drive/Gmail read-only audit

Google Drive was inspected read-only. It contains a private HOCKER structure including AGIS, APP/WEB, DOCUMENTACIÓN, integrations/microtasks and code folders. It is useful as a secondary knowledge source, but GitHub/configuration/production evidence remains authoritative. The credential document is private to the owner account but contains restricted secrets and must be excluded from RAG/AGI indexing.

Gmail was inspected read-only. It contains operational HOCKER context mixed with personal/provider notifications. Gmail is not approved as a write capability. Future integration should begin with search/read/classify/draft only; send remains behind Owner Gate and explicit human approval.

No Drive files were reorganized, no permissions were changed, no Gmail labels were created, and no messages were sent.

## Credential rotation status

The plaintext credential inventory contains active-looking credentials across several providers. Values were not copied into code or responses and must be treated as compromised-by-documentation until provider-side replacement is proved.

A complete rotation cannot be truthfully declared from this environment because provider-native create/install/revoke operations and environment-variable writes are not available for every provider. Required sequence per secret family remains: issue replacement -> install in secret manager/environment -> redeploy/smoke -> revoke old -> negative-test old -> remove plaintext/history -> record evidence.

The Drive credential document is to be treated as quarantined/RESTRICTED and excluded from future knowledge ingestion. Production GO remains blocked until all privileged secret families have completed the sequence above.

## Production freeze

No merge to `main`, no production Vercel promotion, no production Supabase DDL, no Android production signing, and no store publication were performed.