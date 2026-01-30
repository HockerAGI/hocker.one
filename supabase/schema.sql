create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'owner',
  created_at timestamptz default now()
);

create table if not exists public.nodes (
  id text primary key,
  name text not null,
  type text not null default 'local',
  status text not null default 'unknown',
  last_seen_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.commands (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id) on delete set null,
  command text not null,
  payload jsonb default '{}'::jsonb,
  status text not null default 'queued',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  executed_at timestamptz
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id) on delete set null,
  level text not null default 'info',
  type text not null default 'generic',
  message text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_events_created_at on public.events (created_at desc);
create index if not exists idx_commands_created_at on public.commands (created_at desc);
create index if not exists idx_commands_node_status on public.commands (node_id, status);

alter table public.profiles enable row level security;
alter table public.nodes enable row level security;
alter table public.commands enable row level security;
alter table public.events enable row level security;

create policy "profiles_read_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_upsert_own" on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid());

create policy "nodes_read" on public.nodes
for select to authenticated
using (true);

create policy "nodes_write" on public.nodes
for insert to authenticated
with check (true);

create policy "nodes_update" on public.nodes
for update to authenticated
using (true);

create policy "commands_read" on public.commands
for select to authenticated
using (true);

create policy "commands_write" on public.commands
for insert to authenticated
with check (true);

create policy "events_read" on public.events
for select to authenticated
using (true);

create policy "events_write" on public.events
for insert to authenticated
with check (true);