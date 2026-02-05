-- HOCKER ONE - Schema (FULL COMPLIANCE)
-- Notes:
-- - Multi-project real (project_id everywhere)
-- - system_controls is per-project (PK = project_id)
-- - Multi-user real via project_members + RLS by membership
-- - No "new user = owner"
-- - Commands include approved_by/approved_at for traceability

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums (idempotent)
do $$ begin
  create type public.command_status as enum ('queued','running','done','error','needs_approval','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_level as enum ('info','warn','error');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.projects (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Project membership (per project)
create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('owner','admin','operator')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx on public.project_members(user_id);

-- system controls per project (FIX for real multi-project)
drop table if exists public.system_controls cascade;
create table public.system_controls (
  project_id text primary key references public.projects(id) on delete cascade,
  kill_switch boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.nodes (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  kind text not null default 'agent',
  status text not null default 'offline',
  last_seen timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodes_project_id_idx on public.nodes(project_id);

create table if not exists public.agis (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'offline',
  endpoint_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agis_project_id_idx on public.agis(project_id);

create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  node_id text not null references public.nodes(id) on delete cascade,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  signature text not null,
  status public.command_status not null default 'queued',
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error text
);

create index if not exists commands_project_id_idx on public.commands(project_id);
create index if not exists commands_node_id_idx on public.commands(node_id);
create index if not exists commands_status_idx on public.commands(status);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  level public.event_level not null default 'info',
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_project_id_idx on public.events(project_id);
create index if not exists events_created_at_idx on public.events(created_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_project_id_idx on public.audit_logs(project_id);
create index if not exists audit_created_at_idx on public.audit_logs(created_at);

-- NOVA chat persistence
create table if not exists public.nova_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'NOVA Chat',
  created_at timestamptz not null default now()
);

create index if not exists nova_threads_project_id_idx on public.nova_threads(project_id);
create index if not exists nova_threads_user_id_idx on public.nova_threads(user_id);

create table if not exists public.nova_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  thread_id uuid not null references public.nova_threads(id) on delete cascade,
  role text not null check (role in ('user','nova','system')),
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nova_messages_project_id_idx on public.nova_messages(project_id);
create index if not exists nova_messages_thread_id_idx on public.nova_messages(thread_id);
create index if not exists nova_messages_created_at_idx on public.nova_messages(created_at);

-- SUPPLY
create table if not exists public.supply_products (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  price_cents int not null default 0,
  currency text not null default 'MXN',
  stock int not null default 0,
  active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SKU should be unique per project
do $$ begin
  alter table public.supply_products drop constraint if exists supply_products_sku_key;
exception when undefined_object then null; end $$;

create unique index if not exists supply_products_project_sku_uniq on public.supply_products(project_id, sku);
create index if not exists supply_products_project_id_idx on public.supply_products(project_id);

create table if not exists public.supply_orders (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  status text not null default 'new',
  total_cents int not null default 0,
  currency text not null default 'MXN',
  items jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supply_orders_project_id_idx on public.supply_orders(project_id);

-- Seed global project (idempotent)
insert into public.projects (id, name)
values ('global', 'Global')
on conflict (id) do nothing;

-- Ensure system_controls row exists for global
insert into public.system_controls (project_id, kill_switch, meta)
values ('global', false, '{}'::jsonb)
on conflict (project_id) do nothing;

-- Helper functions for RLS
create or replace function public.is_project_member(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.project_role(pid text)
returns text
language sql
stable
as $$
  select coalesce((
    select pm.role
    from public.project_members pm
    where pm.project_id = pid and pm.user_id = auth.uid()
    limit 1
  ), 'none');
$$;

-- New user hook (NO owner auto)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  -- Default membership: global as operator
  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, 'operator')
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
alter table public.project_members enable row level security;
alter table public.system_controls enable row level security;
alter table public.nodes enable row level security;
alter table public.agis enable row level security;
alter table public.commands enable row level security;
alter table public.events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.nova_threads enable row level security;
alter table public.nova_messages enable row level security;
alter table public.supply_products enable row level security;
alter table public.supply_orders enable row level security;

-- Drop old policies if they exist (safe cleanup)
drop policy if exists projects_select_auth on public.projects;
drop policy if exists profiles_read_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

drop policy if exists nodes_select_auth on public.nodes;
drop policy if exists agis_select_auth on public.agis;
drop policy if exists commands_select_auth on public.commands;
drop policy if exists events_select_auth on public.events;
drop policy if exists audit_select_auth on public.audit_logs;
drop policy if exists nova_threads_select_own on public.nova_threads;
drop policy if exists nova_messages_select_own on public.nova_messages;
drop policy if exists supply_products_select_auth on public.supply_products;
drop policy if exists supply_orders_select_auth on public.supply_orders;

-- New policies (membership-based)
create policy projects_select_member
on public.projects for select
to authenticated
using (public.is_project_member(id));

create policy profiles_read_own
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid());

create policy project_members_select_own
on public.project_members for select
to authenticated
using (user_id = auth.uid());

create policy system_controls_select_member
on public.system_controls for select
to authenticated
using (public.is_project_member(project_id));

create policy nodes_select_member
on public.nodes for select
to authenticated
using (public.is_project_member(project_id));

create policy agis_select_member
on public.agis for select
to authenticated
using (public.is_project_member(project_id));

create policy commands_select_member
on public.commands for select
to authenticated
using (public.is_project_member(project_id));

create policy events_select_member
on public.events for select
to authenticated
using (public.is_project_member(project_id));

create policy audit_select_member
on public.audit_logs for select
to authenticated
using (public.is_project_member(project_id));

create policy nova_threads_select_own
on public.nova_threads for select
to authenticated
using (user_id = auth.uid() and public.is_project_member(project_id));

create policy nova_messages_select_own
on public.nova_messages for select
to authenticated
using (
  public.is_project_member(project_id)
  and exists (
    select 1 from public.nova_threads t
    where t.id = nova_messages.thread_id
      and t.user_id = auth.uid()
  )
);

create policy supply_products_select_member
on public.supply_products for select
to authenticated
using (public.is_project_member(project_id));

create policy supply_orders_select_member
on public.supply_orders for select
to authenticated
using (public.is_project_member(project_id));