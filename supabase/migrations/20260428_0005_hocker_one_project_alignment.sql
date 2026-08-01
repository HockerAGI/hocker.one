begin;

-- Alinea el project_id real que usa la app: hocker-one.
-- Mantiene compatibilidad con instalaciones previas que nacieron como global.

insert into public.projects (id, name, meta)
values ('hocker-one', 'Hocker ONE', '{}'::jsonb)
on conflict (id) do update
set name = coalesce(public.projects.name, excluded.name),
    meta = coalesce(public.projects.meta, '{}'::jsonb) || excluded.meta;

insert into public.project_members (project_id, user_id, role)
select 'hocker-one', source.user_id, source.role
from public.project_members source
where source.project_id = 'global'
  and not exists (
    select 1
    from public.project_members existing
    where existing.project_id = 'hocker-one'
      and existing.user_id = source.user_id
  );

insert into public.system_controls (project_id, id, kill_switch, allow_write, meta)
values ('hocker-one', 'global', false, false, '{}'::jsonb)
on conflict (project_id, id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_role text;
  has_profiles boolean;
begin
  select exists(select 1 from public.profiles) into has_profiles;
  base_role := case when has_profiles then 'operator' else 'owner' end;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, base_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.projects (id, name, meta)
  values
    ('global', 'Global', '{}'::jsonb),
    ('hocker-one', 'Hocker ONE', '{}'::jsonb)
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id, role)
  select candidate.project_id, new.id, base_role
  from (values ('global'::text), ('hocker-one'::text)) as candidate(project_id)
  where not exists (
    select 1
    from public.project_members existing
    where existing.project_id = candidate.project_id
      and existing.user_id = new.id
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

commit;
