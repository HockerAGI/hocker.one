create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================
-- TYPES
-- =========================
do $$
begin
  create type public.command_status as enum ('queued','running','succeeded','failed','cancelled','needs_approval');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_level as enum ('info','warn','error','critical');
exception when duplicate_object then null;
end $$;

-- =========================
-- PROJECTS (multi-proyecto)
-- =========================
create table if not exists public.projects (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

insert into public.projects (id, name)
values ('global', 'Global')
on conflict (id) do nothing;

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'owner', -- owner/admin/operator
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.email, 'user'), 'owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- SYSTEM CONTROLS (KILL SWITCH)
-- =========================
create table if not exists public.system_controls (
  id text primary key default 'global',
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  kill_switch boolean not null default false,
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into public.system_controls (id, project_id, kill_switch)
values ('global', 'global', false)
on conflict (id) do nothing;

create index if not exists idx_controls_project on public.system_controls(project_id);

-- =========================
-- NODES
-- =========================
create table if not exists public.nodes (
  id text primary key,
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  name text not null,
  type text not null default 'local', -- local/cloud
  status text not null default 'unknown', -- online/offline/unknown
  last_seen_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_nodes_project_seen on public.nodes(project_id, last_seen_at desc);

-- =========================
-- AGIS
-- =========================
create table if not exists public.agis (
  id text primary key,
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  name text not null,
  purpose text,
  status text not null default 'offline', -- online/offline/degraded
  endpoints jsonb default '{}'::jsonb,
  permissions jsonb default '{}'::jsonb,
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_agis_project_updated on public.agis(project_id, updated_at desc);

-- =========================
-- COMMANDS
-- =========================
create table if not exists public.commands (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  correlation_id uuid not null default uuid_generate_v4(),
  node_id text references public.nodes(id) on delete set null,
  command text not null,
  payload jsonb default '{}'::jsonb,
  signature text not null, -- HMAC sha256
  status public.command_status not null default 'queued',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  executed_at timestamptz,
  finished_at timestamptz,
  result jsonb default '{}'::jsonb,
  error text
);

create index if not exists idx_commands_project_created_at on public.commands (project_id, created_at desc);
create index if not exists idx_commands_node_status on public.commands (node_id, status);

-- =========================
-- EVENTS
-- =========================
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  correlation_id uuid,
  command_id uuid references public.commands(id) on delete set null,
  node_id text references public.nodes(id) on delete set null,
  level public.event_level not null default 'info',
  type text not null default 'generic',
  message text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_events_project_created_at on public.events (project_id, created_at desc);

-- =========================
-- AUDIT LOGS (VERTX)
-- =========================
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  actor_type text not null, -- user/agi/system
  actor_id text,
  action text not null,
  target text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_project_created_at on public.audit_logs (project_id, created_at desc);

-- =========================
-- NOVA CHAT
-- =========================
create table if not exists public.nova_threads (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  user_id uuid references auth.users(id) on delete cascade,
  title text default 'NOVA Chat',
  created_at timestamptz default now()
);

create table if not exists public.nova_messages (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  thread_id uuid references public.nova_threads(id) on delete cascade,
  role text not null, -- user | nova | system
  content text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_nova_messages_project_thread on public.nova_messages(project_id, thread_id, created_at);

-- =========================
-- HOCKER SUPPLY (MVP)
-- =========================
create table if not exists public.supply_products (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  sku text unique,
  name text not null,
  description text,
  unit_cost numeric(12,2) default 0,
  price numeric(12,2) default 0,
  stock int default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.supply_orders (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  status text not null default 'pending', -- pending/paid/producing/shipped/delivered/cancelled
  customer_name text,
  customer_phone text,
  total numeric(12,2) default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.supply_order_items (
  id uuid primary key default uuid_generate_v4(),
  project_id text not null default 'global' references public.projects(id) on delete restrict,
  order_id uuid references public.supply_orders(id) on delete cascade,
  product_id uuid references public.supply_products(id) on delete set null,
  qty int not null default 1,
  unit_price numeric(12,2) default 0,
  created_at timestamptz default now()
);

create index if not exists idx_supply_products_project_created_at on public.supply_products(project_id, created_at desc);
create index if not exists idx_supply_orders_project_created_at on public.supply_orders(project_id, created_at desc);
create index if not exists idx_supply_items_project_order on public.supply_order_items(project_id, order_id);

-- =========================
-- RLS (browser: SOLO LECTURA)
-- =========================
alter table public.projects enable row level security;
alter table public.profiles enable row level security;
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
alter table public.supply_order_items enable row level security;

-- Projects: read list (auth)
create policy "projects_select_auth" on public.projects
for select to authenticated
using (true);

-- Profiles: read/update own
create policy "profiles_read_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid());

-- Controls: read for authenticated
create policy "controls_select_auth" on public.system_controls
for select to authenticated
using (true);

-- Read-only (auth)
create policy "nodes_select_auth" on public.nodes for select to authenticated using (true);
create policy "agis_select_auth" on public.agis for select to authenticated using (true);
create policy "commands_select_auth" on public.commands for select to authenticated using (true);
create policy "events_select_auth" on public.events for select to authenticated using (true);
create policy "audit_select_auth" on public.audit_logs for select to authenticated using (true);

create policy "supply_products_select_auth" on public.supply_products for select to authenticated using (true);
create policy "supply_orders_select_auth" on public.supply_orders for select to authenticated using (true);
create policy "supply_items_select_auth" on public.supply_order_items for select to authenticated using (true);

-- NOVA chat: dueño
create policy "nova_threads_select_own" on public.nova_threads
for select to authenticated
using (user_id = auth.uid());

create policy "nova_messages_select_own" on public.nova_messages
for select to authenticated
using (
  exists (
    select 1 from public.nova_threads t
    where t.id = nova_messages.thread_id
      and t.user_id = auth.uid()
  )
);

-- NO INSERT/UPDATE policies => browser no muta. Solo service role (server/NOVA/agent).