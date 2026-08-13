# Hocker Ads Catalog Reconciliation — Design

**Goal:** reconcile Hocker ONE's control-plane descriptors with the approved Hocker Ads Product Definition in `HockerAGI/hocker.ads/main` without activating runtime capabilities.

## Source of truth
- Hocker Ads Product Definition v1.0 in `HockerAGI/hocker.ads/main`.
- Existing Hocker ONE runtime/security evidence remains authoritative for implementation status.

## Scope
- Add `HockerAGI/hocker.ads` to the Operations Catalog repository map.
- Override the Hocker Ads Operations Catalog descriptor to reflect the approved 8/8 product scope.
- Reconcile Hocker Ads wording in System Registry while preserving `building`.
- Reconcile the planned Hocker Ads client-app descriptor to the seven approved customer navigation domains while preserving `planned`.
- Add a regression contract that locks the above truth and confirms client sessions/runtime Ads remain fail-closed.

## Explicit non-goals
- No `public-catalog.ts` marketing rewrite in this PR.
- No dashboard or command-center cosmetic rewrite in this PR.
- No RLS/permission widening.
- No capability activation or Ads API connection.
- No tenant/project creation.
- No client session enablement.
- No Hocker Ads Vercel/Supabase/Stripe deployment.
- No Owner Gate, auth or AAL2 change.

## Safety rule
Descriptive product scope may expand to match the approved product definition, but operational state may only advance when runtime evidence exists. Therefore Hocker Ads remains `development` / `building` / `planned` across the affected registries.
