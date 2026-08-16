-- Tighten direct table privileges for the unified AGI session store.
-- Supabase default privileges may grant service_role operations that are not required
-- by the application contract (TRUNCATE, REFERENCES, TRIGGER). Keep only CRUD.

revoke all on table public.agi_sessions from service_role;
revoke all on table public.agi_messages from service_role;

grant select, insert, update, delete on table public.agi_sessions to service_role;
grant select, insert, update, delete on table public.agi_messages to service_role;
