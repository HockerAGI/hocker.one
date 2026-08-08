# HOCKER Ecosystem Production-Readiness Checkpoint — 2026-08-07

Status: **CONDITIONAL NO-GO — HARDENING BRANCHES ONLY — PRODUCTION FROZEN**

This checkpoint records the evidence gathered and changes made during the 2026-08-07 production-readiness audit. It does not authorize merges to `main`, production database migrations, Vercel production promotion, node rollout, payment configuration changes, Android production signing, Play Store publication, or any other production release.

## Canonical release rule

A production GO requires all blocking gates to be green, rollback/evidence to be available, and explicit final owner authorization. Until then, all remediation remains isolated in draft pull requests and Preview/test execution paths.

## Repository hardening matrix

| Component | Draft PR | Validated hardening head | Evidence | State |
| --- | ---: | --- | --- | --- |
| Hocker One | #127 | `ea1076c2e4b07a0ba8baa134007bca2ea0518630` before this checkpoint update | CI green; Android debug green; temporary signed APK/AAB validation green; Vercel Preview READY; no inspected build/runtime errors | GREEN on branch; production blocked |
| NOVA | #16 | `3095f5472f77b18d6914886fe174746e82b67f08` | regression tests, typecheck, build, production dependency audit and full dependency audit green | GREEN on branch |
| Hocker Node Agent | #4 | `0a8e5089d4cf69d7ef230e9b36264327c4b2c509` | typecheck, tests, build, production audit and full audit from LOW green | GREEN on branch |
| HOCKER web | #10 | `bb793dc30e015abe2d27b596a29bc637bbbe1e02` | tests, lint, typecheck, build, production smoke, production/full audits green; matching Vercel Preview READY with no inspected build/runtime errors | GREEN on branch |
| Chido Casino | #34 | `12a1de07602c78eb6d3d0f1ab2428ba293c579cc` | functional CI baseline `2fb2c307a713a2eec6984b0917e83c4b2a0d8507` green through full audit from LOW; final verified head differs only by `.github/VERIFIED_PREVIEW_SEAL.md`; matching Vercel Preview READY and verified, no inspected build/runtime errors | GREEN on branch |

All five PRs remain draft/open and unmerged.

## Hocker One remediations completed on branch

### Owner Gate and legacy command execution

- Legacy `/api/commands` no longer trusts request-controlled approval state.
- Legacy command creation is restricted to owner/admin and uses a server-owned classification policy.
- Unknown/non-read legacy commands fail closed into required approval.
- The approval route requires owner/admin, seals approval audit evidence, re-signs the command and only then makes it executable.
- The cloud executor now proves an atomic queued→running claim by requiring the conditional update to return the claimed row before any side effect.
- Command-signing HMAC keys were removed from bearer-token candidates so signing and API authentication remain separate security domains.
- Regression coverage locks the creation, approval, signature and claim lifecycle.

### Supabase authorization migration prepared, not applied

`supabase/migrations/20260807_hocker_one_commands_owner_gate_hardening.sql` is prepared to remove the operator-equivalent command write path and replace it with owner/admin-specific authorization. It has **not** been applied to production.

Production read-only validation still shows:

- `public.v_agi_canon_completeness` as a SECURITY DEFINER view available to authenticated users.
- RLS-enabled objects with no policies reported by advisors.
- broad GraphQL/function advisor warnings requiring targeted review.
- leaked-password protection disabled.

Direct privilege inspection also showed that `anon`/`authenticated` do not have client schema/table access to the inspected `stripe` and `ledger` data surfaces, so advisor remediation must be evidence-based rather than blanket.

### Android / mobile release readiness

- Android compile/target SDK moved to API 36.
- Android Gradle Plugin moved to 8.10.1; Gradle wrapper remains 8.11.1.
- Debug APK validation passes.
- Release APK/AAB validation passes with an ephemeral CI signing key; production signing remains intentionally skipped.
- `bundletool` 1.18.3 is pinned and its SHA-256 (`a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29`) is verified before the downloaded JAR is executed.
- APK signature, zip alignment, package ID, API target and bundle-derived universal APK are checked in CI.

### PWA / private control-plane behavior

- PWA identity is stable at `/app/nova`.
- Service-worker updates bypass HTTP cache.
- The worker never caches `/api/*`, authenticated successful navigations or private response data.
- Only a static, generic offline document is cached.
- No portrait-only orientation lock is forced.
- Regression tests enforce the privacy-safe offline contract.

### Supply-chain controls

- External GitHub Actions are pinned to full immutable commit SHAs.
- checkout credentials are not persisted.
- CODEOWNERS, Dependabot and SECURITY.md are present.
- Full dependency audits block known HIGH issues in Hocker One.
- The duplicate CodeQL advanced workflow was removed because GitHub Default Setup was already active; the previous SARIF failure was a configuration collision, not an application-code failure.
- The available GitHub connector does not expose native Secret Scanning or Code Scanning alert inventories, so zero-alert status is **not** asserted by this checkpoint.

## Ecosystem dependency remediation

The hardening branches remediated current advisories without reducing application test coverage:

- Hocker One: `js-yaml 4.3.1`, `nanoid 3.3.17`.
- NOVA: `fast-uri 3.1.5`.
- Node Agent: `esbuild 0.28.1`; full dependency audit now runs from LOW.
- HOCKER web: `nanoid 3.3.17`, `js-yaml 4.3.1`; production and full audits green.
- Chido: `nanoid 3.3.17`, `postcss 8.5.23`, `js-yaml 4.3.1`, `brace-expansion 1.1.18`, `@babel/core 7.29.7`; production audit runs at HIGH and the complete graph from LOW.

Temporary lockfile-writer workflows used to generate exact reproducible locks were removed after synchronization. Chido's temporary verified-preview finalizer also removed itself before the final metadata-only verified marker commit.

## Credential / secret release blocker

A supplied credential document contains plaintext live credential material across multiple provider families. Values are intentionally excluded from repositories, logs and this checkpoint.

`docs/security/CREDENTIAL_ROTATION_RUNBOOK_2026-08-07.md` now defines the required replacement → protected installation → smoke test → revocation → negative test → history review → evidence sequence.

**Production remains blocked until every credential family actually in use has completed that sequence.** Deleting the document alone is not sufficient; any value that has existed in durable plaintext must be treated as exposed and rotated/revoked according to provider-safe procedure.

## Supabase sandbox blocker requiring owner cost authorization

Supabase returned an exact development-branch cost of **US$0.01344/hour** for the connected organization. The branch has not been created because the provider action requires explicit confirmation of that cost.

After explicit authorization, the intended sequence is:

1. create the isolated Supabase branch;
2. apply the prepared Owner Gate/RLS migration only there;
3. execute owner/admin/operator/member/anon/authenticated/service-role authorization tests;
4. rerun security/performance advisors and direct privilege inspection;
5. validate rollback;
6. produce migration evidence;
7. keep production unchanged until a separate release authorization.

## Remaining operational blockers / limitations

1. **Credential rotation/revocation evidence — P0.** Not complete.
2. **Supabase isolated migration/RLS validation — P0.** Blocked pending explicit authorization of US$0.01344/hour branch cost.
3. **Native GitHub scanning visibility.** Current connector cannot enumerate Secret Scanning / Code Scanning alert inventories; compensate with repository/history/provider review before GO.
4. **Repository housekeeping.** Earlier empty Hocker One branches created during tooling error (`tmp/should-not-create`, `noop`, `please-stop`, `stop-creating-branches`, `_mistake`, `x`, `y`) contain no remediation work but must be deleted before GA. The connected GitHub actions available in this audit do not expose ref deletion.
5. **Production identity/signing.** Android production signing / Play App Signing ownership and recovery must be verified separately; ephemeral CI signing evidence is not a production identity.
6. **Final promotion authorization.** Draft PR merges, production DDL, Vercel production deployments and store release remain explicitly unauthorized.

## Release disposition

**CONDITIONAL NO-GO.**

The code/supply-chain/Preview layer is materially hardened and the five isolated branches have passed their available functional/security gates. The remaining blockers are governance and production-safety gates that must not be bypassed: credential rotation, isolated Supabase authorization testing, security-alert/history evidence, housekeeping, production signing readiness and final owner authorization.

No production deployment is authorized by this checkpoint.
