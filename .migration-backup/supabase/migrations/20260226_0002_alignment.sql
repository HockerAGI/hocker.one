begin;

create extension if not exists pgcrypto;

insert into public.projects (id, name, meta)
values ('global', 'Global', '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.agis (
  id text primary key,
  name text,
  description text,
  version text,
  tags text[] not null default '{}',
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.agis enable row level security;

drop policy if exists "agis_select_authed" on public.agis;
create policy "agis_select_authed"
on public.agis
for select
to authenticated
using (true);

drop policy if exists "agis_insert_admin" on public.agis;
create policy "agis_insert_admin"
on public.agis
for insert
to authenticated
with check (true);

drop policy if exists "agis_update_admin" on public.agis;
create policy "agis_update_admin"
on public.agis
for update
to authenticated
using (true)
with check (true);

commit;