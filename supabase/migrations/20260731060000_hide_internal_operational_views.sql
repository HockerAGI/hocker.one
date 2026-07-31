-- Internal operational views are server-only.
-- They remain available to service_role through ownership/default privileges.

revoke all privileges on table public.v_agi_operational_state from anon, authenticated;
revoke all privileges on table public.v_queue_without_run from anon, authenticated;
