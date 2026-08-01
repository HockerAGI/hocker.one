create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.is_project_admin(text) set schema private;
alter function private.is_project_admin(text) set search_path = public, pg_temp;

revoke all on function private.is_project_admin(text) from public, anon;
grant execute on function private.is_project_admin(text) to authenticated, service_role;
