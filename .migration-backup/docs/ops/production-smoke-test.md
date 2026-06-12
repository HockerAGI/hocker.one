# Production Smoke Test - Hocker ONE

## Command

    npm run ops:prod:smoke

## Validates

- Public pages.
- Private protected routes.
- Security hardening readiness.
- Tenant RLS readiness.
- Owner gate protection.

## Safety

Read-only validation. No Supabase mutation.
