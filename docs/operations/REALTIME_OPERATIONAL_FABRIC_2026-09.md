# Hocker One — Operational Realtime Fabric

Status: **CANDIDATE / EXACT-HEAD VALIDATION REQUIRED**

## Purpose

Provide near-real-time invalidation for Hocker One operational surfaces without creating a second OperationalState.

## Current architecture

`agi_action_queue`, `agi_agents`, `agi_runs`, and `nodes`
→ database trigger
→ `public.hocker_operational_events`
→ Supabase Realtime (`supabase_realtime` publication)
→ authenticated project-member client
→ `hocker:operational-refresh`
→ existing `getHockerOperationalSnapshot()` / existing API reads

The event payload is intentionally minimal: project, source table, operation, record id, timestamp. It does not contain financial data, secrets, prompts, model output, or full source rows.

## Security

- `hocker_operational_events` has RLS enabled.
- Authenticated reads require `public.is_project_member(project_id)`.
- Anonymous access and client writes are revoked.
- Trigger function is `SECURITY DEFINER` with explicit `search_path`.
- Material actions remain governed by the existing Owner Gate/AAL2 decision route.

## Fallback

Realtime is an invalidation accelerator, not the source of truth. The client keeps a 30-second refresh fallback so stale event delivery does not become stale state.

## Production migration

Supabase production applied migration version `20260901063237` as `operational_event_fabric`.

Verified after migration:

- table exists;
- event table row count starts at 0;
- Realtime publication contains the table;
- source tables retain RLS;
- no `realtime.messages` ownership bypass was attempted.

## Not yet certified

The browser subscription itself still requires exact-head Preview validation and a human authenticated smoke test. This document must not be interpreted as proof that the browser is currently receiving events until that smoke test passes.
