-- HOCKER.ONE / Control Plane schema (Supabase)
create extension if not exists "pgcrypto";

do $$ begin
  create type public.command_status as enum ('needs_approval','queued','running','succeeded','failed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_level as enum ('info','warn','error','critical');
exception when duplicate_object then null; end $$;

-- PROJECTS
create table if not exists public.projects (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.projects (id, name)
values ('global','Global')
on conflict (id) do nothing;

-- PROFILES (global role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'operator', -- owner | admin | operator | viewer
  created_at timestamptz not null default now()
);

-- MEMBERSHIP per project
create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator', -- owner | admin | operator | viewer
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- NODES
create table if not exists public.nodes (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade default 'global',
  name text not null,
  type text not null default 'agent',
  status text not null default 'offline',
  last_seen_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- SYSTEM CONTROLS (kill-switch + permissions)
create table if not exists public.system_controls (
  id text primary key default 'global',
  project_id text not null references public.projects(id) on delete cascade default 'global',
  kill_switch boolean not null default false,
  allow_shell boolean not null default false,
  allow_filesystem boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.system_controls (id, project_id)
values ('global','global')
on conflict (id) do nothing;

-- COMMANDS (queue)
create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade default 'global',
  node_id text not null references public.nodes(id) on delete cascade,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.command_status not null default 'queued',
  needs_approval boolean not null default false,
  signature text not null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error text
);

-- EVENTS (log)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade default 'global',
  node_id text,
  level public.event_level not null default 'info',
  type text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- CHAT NOVA
create table if not exists public.nova_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade default 'global',
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'NOVA',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nova_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.nova_threads(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade default 'global',
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','nova','system')),
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- SUPPLY (MVP products)
create table if not exists public.supply_products (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade default 'global',
  sku text,
  name text not null,
  description text,
  unit_cost numeric not null default 0,
  price numeric not null default 0,
  stock int not null default 0,
  active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HELPERS
create or replace function public.is_global_owner_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('owner','admin')
  );
$$;

create or replace function public.is_project_member(pid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
  );
$$;

-- First user = owner, others = operator
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c int;
  new_role text;
begin
  select count(*) into c from public.profiles;
  if c = 0 then new_role := 'owner'; else new_role := 'operator'; end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, new_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, new_role)
  on conflict do nothing;

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
alter table public.nodes enable row level security;
alter table public.system_controls enable row level security;
alter table public.commands enable row level security;
alter table public.events enable row level security;
alter table public.nova_threads enable row level security;
alter table public.nova_messages enable row level security;
alter table public.supply_products enable row level security;

-- POLICIES (read for authenticated members; writes via service role from backend)
drop policy if exists projects_select_auth on public.projects;
create policy projects_select_auth on public.projects
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(id));

drop policy if exists profiles_select_auth on public.profiles;
create policy profiles_select_auth on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_global_owner_admin());

drop policy if exists project_members_select_auth on public.project_members;
create policy project_members_select_auth on public.project_members
for select to authenticated
using (user_id = auth.uid() or public.is_global_owner_admin());

drop policy if exists nodes_select_auth on public.nodes;
create policy nodes_select_auth on public.nodes
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(project_id));

drop policy if exists controls_select_auth on public.system_controls;
create policy controls_select_auth on public.system_controls
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(project_id));

drop policy if exists commands_select_auth on public.commands;
create policy commands_select_auth on public.commands
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(project_id));

drop policy if exists events_select_auth on public.events;
create policy events_select_auth on public.events
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(project_id));

drop policy if exists nova_threads_select_own on public.nova_threads;
create policy nova_threads_select_own on public.nova_threads
for select to authenticated
using (user_id = auth.uid() and (public.is_global_owner_admin() or public.is_project_member(project_id)));

drop policy if exists nova_messages_select_own on public.nova_messages;
create policy nova_messages_select_own on public.nova_messages
for select to authenticated
using (
  exists (
    select 1 from public.nova_threads t
    where t.id = nova_messages.thread_id
      and t.user_id = auth.uid()
  )
  and (public.is_global_owner_admin() or public.is_project_member(project_id))
);

drop policy if exists supply_products_select_auth on public.supply_products;
create policy supply_products_select_auth on public.supply_products
for select to authenticated
using (public.is_global_owner_admin() or public.is_project_member(project_id));