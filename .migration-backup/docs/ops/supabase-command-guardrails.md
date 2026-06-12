# Supabase Command Guardrails - Hocker ONE

## Status

Active.

## Purpose

Prevent accidental production database damage while the remote Supabase database remains the current source of truth.

## Blocked production commands

- supabase db push
- supabase migration repair
- supabase db reset

## Reason

The remote database already contains a real operational schema.

The local migration folder is historical and partial. It does not fully represent the current remote database.

## Safe wrapper

Use:

- bash scripts/ops/hocker-supabase-production-guard.sh projects list
- bash scripts/ops/hocker-supabase-production-guard.sh migration list --linked

## Scanner

Use:

- bash scripts/ops/hocker-forbidden-supabase-command-scan.sh

No production mutation is allowed until explicit owner approval and a documented migration strategy exist.
