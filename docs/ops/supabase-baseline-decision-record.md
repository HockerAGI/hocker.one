# Supabase Baseline Decision Record - Hocker ONE

## Status

Accepted.

## Date

2026-05-09

## Context

Hocker ONE is connected to a real remote Supabase project.

- Project ref: yvuibbcuntqpyqiuqggd
- Project name: Hocker AGI Technologies

The remote database already contains a real operational schema with tables, functions, policies, triggers, grants and production-like Chido/Hocker objects.

A schema-only remote snapshot was created and committed as operational evidence:

- supabase/baseline-audit/20260509_112357_remote_public_schema.sql

A gap analysis confirmed that the remote database is significantly ahead of the local migration folder.

Known comparison:

- Remote tables: 50
- Local migration tables detected: 13
- Remote functions: 35
- Local migration functions detected: 6
- Remote policies: 117
- Local migration policies detected: 8

## Decision

The remote Supabase schema is the current source of truth.

The existing local migration folder must be treated as historical and partial migration intent, not as an executable production baseline.

The remote snapshot is accepted as the current evidence baseline for future planning.

Future database changes must be created from the real current remote state, not from outdated local assumptions.

## Forbidden actions until explicit approval

Blocked for production remote database:

- supabase db push
- supabase migration repair
- supabase db reset
- destructive SQL against production
- automatic migration adoption without parity review
- applying old local migrations directly to remote
- rotating production secrets before the final rotation phase

## Allowed actions

- offline reports
- schema-only snapshots
- documentation
- local-only analysis
- read-only SQL audits
- manual hotfix documentation
- future migration planning from the remote baseline

## Operational rule

Before any future database mutation:

1. Create a branch.
2. Document intent.
3. Confirm current remote state.
4. Prepare rollback notes.
5. Validate on non-production or staging when available.
6. Require explicit owner approval.
7. Apply only the minimal required SQL.
8. Record the result in docs/ops or supabase/manual-patches.

## Current baseline checkpoints

- stable-hocker-one-hardening-supabase-hotfix-20260509_041500
- stable-hocker-one-remote-baseline-snapshot-20260509_112822
- stable-hocker-one-prod-validated-baseline-snapshot-20260509_114152
- stable-hocker-one-baseline-gap-analysis-20260509_121335

## Final note

This decision protects Hocker ONE, Chido Casino and the wider HOCKER ecosystem from accidental production database damage while still allowing controlled growth.
