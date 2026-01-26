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
  type text default 'local',
  status text default 'unknown',
  last_seen_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.commands (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id),
  command text not null,
  payload jsonb default '{}'::jsonb,
  status text default 'queued',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  executed_at timestamptz
);

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  node_id text references public.nodes(id),
  level text default 'info',
  type text default 'generic',
  message text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.nodes enable row level security;
alter table public.commands enable row level security;
alter table public.events enable row level security;

create policy "allow_all_profiles" on public.profiles for all to authenticated using (true);
create policy "allow_all_nodes" on public.nodes for all to authenticated using (true);
create policy "allow_all_commands" on public.commands for all to authenticated using (true);
create policy "allow_all_events" on public.events for all to authenticated using (true);