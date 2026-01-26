create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'owner',
  created_at timestamptz default now()
);

-- NODES
create table if not exists public.nodes (
  id text primary key,
  name text not null,
  type text not null default 'local', -- local | cloud | service
  status text not null default 'unknown', -- unknown | online | offline | degraded
  last_seen_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- COMMANDS
create table if not exists public.commands (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id) on delete set null,
  command text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'queued', -- queued | running | done | failed
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  executed_at timestamptz
);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id) on delete set null,
  level text not null default 'info', -- info | warn | error
  type text not null default 'generic',
  message text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_events_created_at on public.events (created_at desc);
create index if not exists idx_commands_created_at on public.commands (created_at desc);
create index if not exists idx_commands_node_status on public.commands (node_id, status);

-- RLS
alter table public.profiles enable row level security;
alter table public.nodes enable row level security;
alter table public.commands enable row level security;
alter table public.events enable row level security;

-- PROFILES policies (solo el propio usuario)
drop policy if exists "profiles_read_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_read_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid());

-- NODES policies (MVP: cualquier usuario autenticado puede ver/escribir; luego lo cerramos por roles)
drop policy if exists "nodes_read" on public.nodes;
drop policy if exists "nodes_write" on public.nodes;
drop policy if exists "nodes_update" on public.nodes;

create policy "nodes_read" on public.nodes
for select to authenticated
using (true);

create policy "nodes_write" on public.nodes
for insert to authenticated
with check (true);

create policy "nodes_update" on public.nodes
for update to authenticated
using (true);

-- COMMANDS policies
drop policy if exists "commands_read" on public.commands;
drop policy if exists "commands_write" on public.commands;
drop policy if exists "commands_update" on public.commands;

create policy "commands_read" on public.commands
for select to authenticated
using (true);

create policy "commands_write" on public.commands
for insert to authenticated
with check (true);

create policy "commands_update" on public.commands
for update to authenticated
using (true);

-- EVENTS policies
drop policy if exists "events_read" on public.events;
drop policy if exists "events_write" on public.events;

create policy "events_read" on public.events
for select to authenticated
using (true);

create policy "events_write" on public.events
for insert to authenticated
with check (true);