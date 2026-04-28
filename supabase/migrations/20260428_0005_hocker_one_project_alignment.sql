begin;

-- Alinea el project_id real que usa la app: hocker-one.
-- Mantiene compatibilidad con instalaciones previas que nacieron como global.

insert into public.projects (id, name, meta)
values ('hocker-one', 'Hocker ONE', '{}'::jsonb)
on conflict (id) do update
set name = coalesce(public.projects.name, excluded.name),
    meta = coalesce(public.projects.meta, '{}'::jsonb) || excluded.meta;

insert into public.project_members (project_id, user_id, role)
select 'hocker-one', user_id, role
from public.project_members
where project_id = 'global'
on conflict (project_id, user_id) do nothing;

insert into public.system_controls (project_id, id, kill_switch, allow_write, meta)
values ('hocker-one', 'global', false, false, '{}'::jsonb)
on conflict (project_id, id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
  values
    ('global', new.id, base_role),
    ('hocker-one', new.id, base_role)
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

commit;
