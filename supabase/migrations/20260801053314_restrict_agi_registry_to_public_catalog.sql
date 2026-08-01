drop policy if exists agis_select_authed on public.agis;
revoke all on table public.agis from anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on table public.agis to service_role;
comment on table public.agis is 'Internal AGI registry. Public and authenticated discovery must use agis_public_catalog.';
