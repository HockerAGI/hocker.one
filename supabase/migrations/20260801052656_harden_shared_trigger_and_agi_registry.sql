alter function public.tg_set_updated_at() set search_path = public, pg_temp;

drop policy if exists agis_insert_admin on public.agis;
drop policy if exists agis_update_admin on public.agis;

revoke insert, update, delete, truncate, references, trigger on table public.agis from authenticated;

grant select on table public.agis to authenticated;

comment on table public.agis is 'AGI registry: authenticated read, service_role-only writes.';
