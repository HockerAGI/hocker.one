# Supabase Baseline Adoption Plan - Hocker ONE

Status: planning only. No database mutations allowed yet.

Current known state:
- Remote Supabase project: yvuibbcuntqpyqiuqggd.
- Remote has real schema, data, policies and functions.
- Remote does not have Supabase CLI migration history registered.
- Local CLI dry-run wants to push all existing migrations.

Hard rule:
- Do not run db push.
- Do not run migration repair until schema parity is confirmed.
- Do not reset remote database.

Next required evidence:
- Remote tables, columns, RLS status, policies, functions and triggers.
- Local migration object inventory.
- Parity report between local migration intent and remote actual schema.

## RPC Execute Hardening Hotfix - 2026-05-09

Applied manually in Supabase SQL Editor.

Sensitive RPCs closed from direct anon/authenticated execution:

- _distribute_affiliate_commission
- crash_play_round
- place_bet
- profiles_add_free_spins
- request_withdrawal

Validation:

- anon can_execute: false
- authenticated can_execute: false
- service_role can_execute: true

Operational meaning:

- Client-side direct execution is blocked.
- Backend/server execution remains available through service_role.
- No data was modified.
