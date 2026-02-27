-- HOCKERCHAIN 20260226_0002_alignment
-- Alineación + RLS + columnas faltantes (idempotente)

begin;

create extension if not exists pgcrypto;

-- ===============
-- PROFILES
-- ===============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ===============
-- HELPERS
-- ===============
create or replace function public.is_project_member(pid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(pid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid() and m.role in ('owner','admin')
  );
$$;

create or replace function public.is_project_owner(pid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- ===============
-- PROJECTS + MEMBERS
-- ===============
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

drop policy if exists projects_select_if_member on public.projects;
create policy projects_select_if_member on public.projects
  for select to authenticated
  using (public.is_project_member(id));

drop policy if exists projects_insert_authenticated on public.projects;
create policy projects_insert_authenticated on public.projects
  for insert to authenticated
  with check (true);

drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner on public.projects
  for update to authenticated
  using (public.is_project_owner(id))
  with check (public.is_project_owner(id));


drop policy if exists project_members_select_if_member on public.project_members;
create policy project_members_select_if_member on public.project_members
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists project_members_insert_owner on public.project_members;
create policy project_members_insert_owner on public.project_members
  for insert to authenticated
  with check (public.is_project_owner(project_id));

drop policy if exists project_members_update_owner on public.project_members;
create policy project_members_update_owner on public.project_members
  for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- ===============
-- NODES
-- ===============
alter table public.nodes add column if not exists tags text[] not null default '{}'::text[];

alter table public.nodes enable row level security;

drop policy if exists nodes_select_if_member on public.nodes;
create policy nodes_select_if_member on public.nodes
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists nodes_insert_admin on public.nodes;
create policy nodes_insert_admin on public.nodes
  for insert to authenticated
  with check (public.is_project_admin(project_id));

drop policy if exists nodes_update_admin on public.nodes;
create policy nodes_update_admin on public.nodes
  for update to authenticated
  using (public.is_project_admin(project_id))
  with check (public.is_project_admin(project_id));

-- ===============
-- SYSTEM CONTROLS
-- ===============
alter table public.system_controls add column if not exists notes text;

alter table public.system_controls enable row level security;

drop policy if exists system_controls_select_if_member on public.system_controls;
create policy system_controls_select_if_member on public.system_controls
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists system_controls_insert_owner on public.system_controls;
create policy system_controls_insert_owner on public.system_controls
  for insert to authenticated
  with check (public.is_project_owner(project_id));

drop policy if exists system_controls_update_owner on public.system_controls;
create policy system_controls_update_owner on public.system_controls
  for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- ===============
-- COMMANDS
-- ===============
alter table public.commands add column if not exists created_by uuid;
alter table public.commands add column if not exists approved_by uuid;
alter table public.commands add column if not exists executed_by uuid;

alter table public.commands drop constraint if exists commands_status_check;
alter table public.commands add constraint commands_status_check
  check (status in ('queued','needs_approval','running','done','error','canceled'));

alter table public.commands enable row level security;

drop policy if exists commands_select_if_member on public.commands;
create policy commands_select_if_member on public.commands
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists commands_insert_if_member on public.commands;
create policy commands_insert_if_member on public.commands
  for insert to authenticated
  with check (public.is_project_member(project_id));

drop policy if exists commands_update_if_member on public.commands;
create policy commands_update_if_member on public.commands
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- ===============
-- EVENTS
-- ===============
alter table public.events drop constraint if exists events_level_check;
alter table public.events add constraint events_level_check
  check (level in ('info','warn','error'));

alter table public.events enable row level security;

drop policy if exists events_select_if_member on public.events;
create policy events_select_if_member on public.events
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists events_insert_if_member on public.events;
create policy events_insert_if_member on public.events
  for insert to authenticated
  with check (public.is_project_member(project_id));

-- ===============
-- NOVA MEMORY
-- ===============
alter table public.nova_threads add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.nova_threads add column if not exists title text;

alter table public.nova_messages drop constraint if exists nova_messages_role_check;
alter table public.nova_messages add constraint nova_messages_role_check
  check (role in ('system','user','assistant','nova'));

alter table public.nova_threads enable row level security;
alter table public.nova_messages enable row level security;

drop policy if exists nova_threads_select_if_member on public.nova_threads;
create policy nova_threads_select_if_member on public.nova_threads
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists nova_threads_insert_if_member on public.nova_threads;
create policy nova_threads_insert_if_member on public.nova_threads
  for insert to authenticated
  with check (public.is_project_member(project_id));

drop policy if exists nova_threads_update_if_member on public.nova_threads;
create policy nova_threads_update_if_member on public.nova_threads
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

drop policy if exists nova_messages_select_if_member on public.nova_messages;
create policy nova_messages_select_if_member on public.nova_messages
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists nova_messages_insert_if_member on public.nova_messages;
create policy nova_messages_insert_if_member on public.nova_messages
  for insert to authenticated
  with check (public.is_project_member(project_id));

-- ===============
-- AGIS REGISTRY
-- ===============
create table if not exists public.agis (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null,
  name text not null,
  role text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, id)
);

create index if not exists agis_project_idx on public.agis(project_id);

alter table public.agis enable row level security;

drop policy if exists agis_select_if_member on public.agis;
create policy agis_select_if_member on public.agis
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists agis_insert_admin on public.agis;
create policy agis_insert_admin on public.agis
  for insert to authenticated
  with check (public.is_project_admin(project_id));

drop policy if exists agis_update_admin on public.agis;
create policy agis_update_admin on public.agis
  for update to authenticated
  using (public.is_project_admin(project_id))
  with check (public.is_project_admin(project_id));

-- ===============
-- SUPPLY RLS
-- ===============
alter table public.supply_products enable row level security;
alter table public.supply_orders enable row level security;
alter table public.supply_order_items enable row level security;
alter table public.supply_payments enable row level security;

drop policy if exists supply_products_select_if_member on public.supply_products;
create policy supply_products_select_if_member on public.supply_products
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists supply_products_write_if_member on public.supply_products;
create policy supply_products_write_if_member on public.supply_products
  for insert to authenticated
  with check (public.is_project_member(project_id));

drop policy if exists supply_products_update_if_member on public.supply_products;
create policy supply_products_update_if_member on public.supply_products
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));


drop policy if exists supply_orders_select_if_member on public.supply_orders;
create policy supply_orders_select_if_member on public.supply_orders
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists supply_orders_write_if_member on public.supply_orders;
create policy supply_orders_write_if_member on public.supply_orders
  for insert to authenticated
  with check (public.is_project_member(project_id));

drop policy if exists supply_orders_update_if_member on public.supply_orders;
create policy supply_orders_update_if_member on public.supply_orders
  for update to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));


drop policy if exists supply_order_items_select_if_member on public.supply_order_items;
create policy supply_order_items_select_if_member on public.supply_order_items
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists supply_order_items_write_if_member on public.supply_order_items;
create policy supply_order_items_write_if_member on public.supply_order_items
  for insert to authenticated
  with check (public.is_project_member(project_id));


drop policy if exists supply_payments_select_if_member on public.supply_payments;
create policy supply_payments_select_if_member on public.supply_payments
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists supply_payments_write_if_member on public.supply_payments;
create policy supply_payments_write_if_member on public.supply_payments
  for insert to authenticated
  with check (public.is_project_member(project_id));

-- ===============
-- AUTH TRIGGER
-- ===============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_role text;
  has_profiles boolean;
begin
  select exists(select 1 from public.profiles) into has_profiles;
  base_role := case when has_profiles then 'operator' else 'owner' end;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, base_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.projects (id, name)
  values ('global', 'Global')
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, base_role)
  on conflict (project_id, user_id) do update set role = excluded.role;

  insert into public.system_controls (id, project_id, kill_switch, allow_write)
  values ('global', 'global', false, false)
  on conflict (id, project_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

commit;
