# Supabase Production Migration Freeze - Hocker ONE

## Status

Active.

## Reason

The production Supabase remote database is real and does not currently have a CLI migration history that safely matches the local migration folder.

## Production freeze rules

Do not run against production:

- supabase db push
- supabase migration repair
- supabase db reset

Do not apply old local migrations directly to production.

Do not execute destructive SQL against production.

## Safe path forward

Use the committed remote schema snapshot and baseline gap analysis as planning evidence.

Future migrations must be created only after remote baseline strategy is approved.
