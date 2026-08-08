# HOCKER Credential Rotation Runbook — 2026-08-07

Status: **RELEASE BLOCKER — NO SECRET VALUES MAY BE STORED IN THIS DOCUMENT**

## Purpose

Remove plaintext credential documents from the operational trust chain and rotate every credential that may have been copied into a document, chat, exported file, repository, build log, trace, or other durable surface.

This runbook intentionally contains service categories only. Never paste a token, password, signing key, webhook secret, service-role key, private key, recovery code, or full connection string into this file, a GitHub issue, PR comment, CI log, or observability trace.

## Release rule

Production promotion is blocked until each credential family below has a recorded owner, replacement credential, deployment target, revocation evidence for the previous value, and a post-rotation smoke test. Rotation must be staged so an old credential is not revoked until the replacement has been installed and verified, except when active compromise is suspected.

## Credential families

| Family | Typical consumers | Required action | Evidence required |
| --- | --- | --- | --- |
| Supabase service-role / secret keys | server routes, workers, migrations | create replacement, update secret stores, verify server-only use, revoke old | successful authenticated server smoke test + old key rejection |
| Supabase database credentials | migrations, admin tooling | rotate password/connection secret, update approved admin clients | successful migration/read-only admin check + old credential rejection |
| GitHub tokens / app credentials | CI, automation, release tooling | replace with least-privilege token/app or OIDC where possible, revoke old | workflow success with new auth + old token revoked |
| Vercel tokens / environment secrets | deployment automation | replace and scope to required team/project, update protected environments | preview/build verification + old token revoked |
| OpenAI / model-provider API keys | NOVA, AGIs, model routers | create project-scoped replacement, update server secret stores, revoke old | model health check without exposing request content + old key revoked |
| Google / Gemini provider keys | model routers / integrations | replace and scope restrictions where supported | provider health check + old key revoked |
| Anthropic / other model-provider keys | model routers / integrations | replace project-scoped key and revoke old | provider health check + old key revoked |
| Stripe secret / webhook credentials | Chido payment backend | rotate secret keys through provider-supported procedure; rotate webhook signing secret with controlled overlap if supported | test-mode payment/webhook verification + old credential revoked |
| Mercado Pago credentials / webhook secrets | Chido payment backend | rotate access credentials and webhook secret through provider controls | test payment/webhook verification + old credential revoked |
| Object-storage / S3 credentials | asset or document storage | create least-privilege replacement, update server secret store, revoke old | read/write smoke test within approved prefix + old credential rejected |
| Langfuse / observability keys | NOVA and service telemetry | replace keys, ensure traces redact secrets/PII | trace health check + old key revoked |
| HOCKER internal API bearer tokens | private service-to-service APIs | generate new random values, keep separate from signing keys | authenticated health/action check + old token rejected |
| HMAC / signing secrets | command signing / node verification | rotate independently from bearer auth; define overlap/version strategy before rollout | signatures accepted with intended generation only; old generation rejected after cutover |
| Android production signing material | Play release pipeline | do not rotate casually; verify ownership, backup, Play App Signing state, access controls | release-key inventory and recovery procedure; no private key in repo/logs |

## Rotation sequence

1. **Inventory** — map each credential family to provider account, environment, application, secret-store key name, runtime consumer, and human owner. Record identifiers only, never values.
2. **Contain** — remove plaintext credential documents from shared operational locations; restrict access to any unavoidable evidence copy; invalidate public/share links.
3. **Create replacement** — use provider-native rotation or create a new least-privilege credential. Prefer project/service-specific credentials over account-wide credentials.
4. **Install replacement** — update only approved server-side secret stores and protected CI environments. Never expose server credentials through `NEXT_PUBLIC_*`, client bundles, Android resources, PWA caches, or public logs.
5. **Validate** — execute the smallest non-destructive smoke test that proves the replacement works in Preview/staging or provider test mode.
6. **Revoke previous value** — revoke/delete the superseded credential immediately after validation, or follow a documented overlap window where provider protocol requires it.
7. **Negative test** — where technically feasible, prove the previous value is rejected without logging the credential itself.
8. **Evidence** — record provider, credential family, owner, rotation timestamp, environments updated, validation result, revocation result, incident/reference ID if applicable, and rollback notes. Never record secret material.
9. **History review** — search current and historical repositories, CI artifacts/logs, issue/PR content, shared drives and exported documents for secret exposure. A credential found in history remains compromised even if removed from the latest file.
10. **Close gate** — mark the family complete only when replacement + validation + revocation + history review are all evidenced.

## Required controls after rotation

- Server-only secrets remain in provider/Vercel/GitHub/Supabase secret stores, never committed to source.
- Signing keys are not reused as bearer credentials.
- CI workflows use least privilege and immutable action references.
- Production secrets are not available to pull requests from untrusted forks.
- Logs, traces and error payloads redact authorization headers, cookies, keys, webhook secrets and connection credentials.
- Secret-scanning / push-protection features should be enabled wherever the provider/repository plan supports them; any unavailable native control must be documented with compensating scanning.
- Credential inventory is metadata-only and reviewed on every release-candidate security gate.

## Incident escalation

If any plaintext value is confirmed publicly exposed, treat it as compromised regardless of observed use: rotate/revoke first, then investigate provider audit logs and application evidence. Do not preserve a live compromised value solely to determine whether it was abused.

## Exit criteria

The credential gate is GREEN only when all credential families actually in use have documented rotation/revocation evidence, the plaintext source is removed from the operational workflow, current repositories contain no known live secrets, and release/runtime smoke tests pass with replacement credentials.
