# Hocker One Audit Checkpoint — 2026-08-07

Status: **AUDIT / HARDENING BRANCH ONLY — PRODUCTION FROZEN**

## Verified baseline

- GitHub main SHA audited: `259185f1d3d81abcf63b10630bf743b1fa8f682d`.
- Vercel production for Hocker One is READY on that main SHA and showed no runtime error clusters in the inspected 7-day window.
- Supabase production is ACTIVE_HEALTHY on PostgreSQL 17.
- Hocker One production control row has `allow_write=false`; this currently mitigates command execution while launch blockers are fixed.

## Launch-blocking findings

### P0 — legacy command Owner Gate can be downgraded by request input

`POST /api/commands` accepts `owner`, `admin` and `operator`, then derives `needs_approval` from request input with a default of false. The command allowlist includes write/external/destructive operations. When `allow_write` is enabled, this permits a caller to request a high-impact command without server-derived Owner Gate classification.

### P0 — operator has broad legacy command table write authority

The current RLS helper used by the `commands` ALL policy treats `operator` as an admin-equivalent role. Because the command HMAC does not cover approval/status metadata, direct row mutation must not be available to operators once execution is enabled.

### P0 — legacy cloud command claim is not proven atomically

The executor conditionally updates a queued row to `running`, but does not require the UPDATE to return the claimed row before continuing. Concurrent workers can therefore race and execute the same previously selected command.

### P1 — command-signing HMAC secrets are accepted as internal API bearer credentials

Signing keys and API authentication credentials are different security domains. `HOCKER_COMMAND_HMAC_SECRET` / `COMMAND_HMAC_SECRET` must not authenticate requests.

### P1 — Supabase internal evidence surface remains broader than needed

The live security advisor still reports the internal `v_agi_canon_completeness` SECURITY DEFINER view, RLS-without-policy objects, and leaked-password protection disabled. Direct SQL verified that `stripe` and `ledger` are not client-usable schemas and that several AGI runtime tables already have client grants revoked, so remediation must be targeted rather than blanket.

### P1 — Android 2026 launch target

The Android project currently targets/compiles API 35. A normal new app/update submission to Google Play after 2026-08-31 requires Android 16 / API 36, unless the permanent private-organization exception applies.

## Positive controls already verified

- Canonical `agi_action_queue` has lock/idempotency/attempt/rollback fields and verifies a returned claim before side effects.
- MCP direct endpoint executes only classified read-only tools; mutations are deferred to Owner Gate.
- GitHub mutation policy blocks main/prod branch writes, validates allowlisted repositories/paths and blocks sensitive paths.
- Android release signing is fail-closed when signing material is absent; cleartext traffic and Android backup are disabled.
- Chido Stripe webhook verifies signature/timestamp/amount/currency/user/folio and settles through a service-role-only atomic database RPC.

## Next gates

1. RED regression tests on draft PR.
2. Server-owned legacy command risk/approval policy.
3. Atomic claim fix.
4. Owner/admin-only legacy command write migration, kept unapplied until isolated Supabase validation.
5. Signing/auth secret separation.
6. Full GitHub supply-chain + Android/PWA + Supabase + Vercel Preview validation.
