# Hocker Ads Repository Alignment — Design

**Goal:** register the new private `HockerAGI/hocker.ads` repository with the existing Hocker One GitHub Owner Gate without changing product runtime, deployment, customer sessions or execution authority.

## Scope
- Add `HockerAGI/hocker.ads` to both existing GitHub repository allowlists.
- Extend the two regression tests that encode the current repository set.
- Update `docs/operations/GITHUB_OWNER_GATE.md`.

## Deferred deliberately
The `operations-catalog.ts` repository mapping and broader Hocker Ads catalog/portal descriptor reconciliation are deferred to a **second PR**. They are not required for the Owner Gate to authorize governed GitHub drafts/execution and keeping them separate reduces the blast radius of this security-sensitive change.

## Non-goals
- No status change from development/building/planned.
- No catalog copy or repository-mapping change.
- No Vercel/Supabase/Ads/payment connection.
- No tenant/project or client session.
- No new mutation tool/path permission.
- No weakening of Owner Gate, AAL2, secret filtering, branch blocking or merge/delete restrictions.

## Verification
Run targeted repository-policy tests plus the repository's full test/typecheck/lint/build gates before the PR is considered mergeable.
