-- HOCKER.ONE / Supabase schema (hardened, multi-project)
-- - Membership via project_members
-- - RLS by membership (no using(true))
-- - system_controls is PER PROJECT (PK: id + project_id)
-- - Adds nova_threads / nova_messages + llm_usage for nova.agi
-- - Adds audit_logs insert policy for admins (server routes)

create extension if not exists "pgcrypto";

-- =============================
-- Profiles
-- =============================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- =============================
-- Projects
-- =============================
create table if not exists public.projects (
  id text primary key,
  name text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- =============================
-- Project members
-- =============================
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_members_project_idx on public.project_members(project_id);
create index if not exists project_members_user_idx on public.project_members(user_id);

alter table public.project_members enable row level security;

create or replace function public.is_project_member(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin')
  );
$$;

create or replace function public.is_project_owner(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
      and pm.role = 'owner'
  );
$$;

-- Projects: members can read metadata
drop policy if exists "projects_read_members" on public.projects;
create policy "projects_read_members"
on public.projects
for select
using (public.is_project_member(projects.id));

-- Project members: self read or admins
drop policy if exists "pm_self_or_admin_read" on public.project_members;
create policy "pm_self_or_admin_read"
on public.project_members
for select
using (
  user_id = auth.uid()
  or public.is_project_admin(project_id)
);

-- Project members: admins can manage membership
drop policy if exists "pm_admin_write" on public.project_members;
create policy "pm_admin_write"
on public.project_members
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- Trigger: handle_new_user
-- =============================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_user boolean;
  base_role text;
begin
  select not exists(select 1 from public.profiles) into first_user;
  base_role := case when first_user then 'owner' else 'operator' end;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, base_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.projects (id, name)
  values ('global', 'Global')
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, base_role)
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =============================
-- Nodes
-- =============================
create table if not exists public.nodes (
  id text primary key,
  project_id text not null default 'global',
  name text not null,
  status text not null default 'offline' check (status in ('online','offline','degraded')),
  last_heartbeat timestamptz,
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodes_project_idx on public.nodes(project_id);

alter table public.nodes enable row level security;

drop policy if exists "nodes_read_members" on public.nodes;
create policy "nodes_read_members"
on public.nodes
for select
using (public.is_project_member(project_id));

drop policy if exists "nodes_write_admin" on public.nodes;
create policy "nodes_write_admin"
on public.nodes
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- AGIs
-- =============================
create table if not exists public.agis (
  id text primary key,
  project_id text not null default 'global',
  name text not null,
  role text not null,
  status text not null default 'offline' check (status in ('online','offline','degraded')),
  endpoint_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agis_project_idx on public.agis(project_id);

alter table public.agis enable row level security;

drop policy if exists "agis_read_members" on public.agis;
create policy "agis_read_members"
on public.agis
for select
using (public.is_project_member(project_id));

drop policy if exists "agis_write_admin" on public.agis;
create policy "agis_write_admin"
on public.agis
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- Seed AGIs (global)
insert into public.agis (id, project_id, name, role, status, endpoint_url, metadata) values
  ('nova', 'global', 'NOVA', 'orchestrator', 'offline', null, '{"tier":"core"}'),
  ('nova_ads', 'global', 'NOVA ADS', 'ads_manager', 'offline', null, '{"tier":"sub"}'),
  ('candy_ads', 'global', 'Candy Ads', 'creative', 'offline', null, '{"tier":"sub"}'),
  ('pro_ia', 'global', 'PRO IA', 'video', 'offline', null, '{"tier":"sub"}'),
  ('numia', 'global', 'Numia', 'finance', 'offline', null, '{"tier":"core"}'),
  ('jurix', 'global', 'Jurix', 'legal', 'offline', null, '{"tier":"core"}'),
  ('curvewind', 'global', 'Curvewind', 'creative_engine', 'offline', null, '{"tier":"core"}'),
  ('vertx', 'global', 'Vertx', 'audit', 'offline', null, '{"tier":"core"}'),
  ('hostia', 'global', 'Hostia', 'infra', 'offline', null, '{"tier":"core"}'),
  ('trackhok', 'global', 'Trackhok IA', 'gps_predictive', 'offline', null, '{"tier":"functional"}'),
  ('nexpa', 'global', 'NEXPA IA', 'security', 'offline', null, '{"tier":"functional"}'),
  ('chido_wins', 'global', 'CHIDO WINS', 'betting', 'offline', null, '{"tier":"functional"}'),
  ('chido_gerente', 'global', 'Chido Gerente', 'ops', 'offline', null, '{"tier":"functional"}')
on conflict (id) do nothing;

-- =============================
-- Commands
-- =============================
create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  node_id text not null,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  signature text,
  status text not null default 'queued' check (status in ('needs_approval','queued','running','done','failed','cancelled')),
  needs_approval boolean not null default false,
  approved_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists commands_project_idx on public.commands(project_id);
create index if not exists commands_node_idx on public.commands(node_id);
create index if not exists commands_status_idx on public.commands(status);

alter table public.commands enable row level security;

drop policy if exists "commands_read_members" on public.commands;
create policy "commands_read_members"
on public.commands
for select
using (public.is_project_member(project_id));

drop policy if exists "commands_write_admin" on public.commands;
create policy "commands_write_admin"
on public.commands
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- Events
-- =============================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  node_id text,
  level text not null default 'info' check (level in ('info','warn','error')),
  type text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_project_idx on public.events(project_id);
create index if not exists events_created_idx on public.events(created_at);

alter table public.events enable row level security;

drop policy if exists "events_read_members" on public.events;
create policy "events_read_members"
on public.events
for select
using (public.is_project_member(project_id));

drop policy if exists "events_write_admin" on public.events;
create policy "events_write_admin"
on public.events
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- Audit logs
-- =============================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  actor_type text not null default 'user',
  actor_id uuid,
  action text not null,
  target text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_project_idx on public.audit_logs(project_id);
create index if not exists audit_created_idx on public.audit_logs(created_at);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_read_admin" on public.audit_logs;
create policy "audit_read_admin"
on public.audit_logs
for select
using (public.is_project_admin(project_id));

-- allow inserts from project admins (server routes)
drop policy if exists "audit_insert_admin" on public.audit_logs;
create policy "audit_insert_admin"
on public.audit_logs
for insert
with check (public.is_project_admin(project_id));

-- =============================
-- System controls (PER PROJECT)
-- =============================
create table if not exists public.system_controls (
  id text not null,
  project_id text not null default 'global',
  kill_switch boolean not null default false,
  allow_write boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (id, project_id)
);

alter table public.system_controls enable row level security;

drop policy if exists "controls_read_admin" on public.system_controls;
create policy "controls_read_admin"
on public.system_controls
for select
using (public.is_project_admin(project_id));

drop policy if exists "controls_write_owner" on public.system_controls;
create policy "controls_write_owner"
on public.system_controls
for all
using (public.is_project_owner(project_id))
with check (public.is_project_owner(project_id));

insert into public.system_controls (id, project_id, kill_switch, allow_write)
values ('global', 'global', false, false)
on conflict (id, project_id) do nothing;

-- =============================
-- Supply (optional)
-- =============================
create table if not exists public.supply_products (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  sku text,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','archived')),
  unit_cost numeric not null default 0,
  unit_price numeric not null default 0,
  stock integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supply_products_project_idx on public.supply_products(project_id);

alter table public.supply_products enable row level security;

drop policy if exists "supply_products_read_members" on public.supply_products;
create policy "supply_products_read_members"
on public.supply_products
for select
using (public.is_project_member(project_id));

drop policy if exists "supply_products_write_admin" on public.supply_products;
create policy "supply_products_write_admin"
on public.supply_products
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create table if not exists public.supply_orders (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  supplier_id uuid,
  status text not null default 'draft' check (status in ('draft','placed','received','cancelled')),
  currency text not null default 'MXN',
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supply_orders_project_idx on public.supply_orders(project_id);

alter table public.supply_orders enable row level security;

drop policy if exists "supply_orders_read_members" on public.supply_orders;
create policy "supply_orders_read_members"
on public.supply_orders
for select
using (public.is_project_member(project_id));

drop policy if exists "supply_orders_write_admin" on public.supply_orders;
create policy "supply_orders_write_admin"
on public.supply_orders
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create table if not exists public.supply_suppliers (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  name text not null,
  contact jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists supply_suppliers_project_idx on public.supply_suppliers(project_id);

alter table public.supply_suppliers enable row level security;

drop policy if exists "supply_suppliers_read_members" on public.supply_suppliers;
create policy "supply_suppliers_read_members"
on public.supply_suppliers
for select
using (public.is_project_member(project_id));

drop policy if exists "supply_suppliers_write_admin" on public.supply_suppliers;
create policy "supply_suppliers_write_admin"
on public.supply_suppliers
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- NOVA chat storage (for nova.agi)
-- =============================
create table if not exists public.nova_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nova_threads_project_idx on public.nova_threads(project_id);

alter table public.nova_threads enable row level security;

drop policy if exists "nova_threads_read_members" on public.nova_threads;
create policy "nova_threads_read_members"
on public.nova_threads
for select
using (public.is_project_member(project_id));

drop policy if exists "nova_threads_write_admin" on public.nova_threads;
create policy "nova_threads_write_admin"
on public.nova_threads
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create table if not exists public.nova_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  thread_id uuid not null references public.nova_threads(id) on delete cascade,
  role text not null check (role in ('system','user','nova','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists nova_messages_thread_idx on public.nova_messages(thread_id);
create index if not exists nova_messages_project_idx on public.nova_messages(project_id);
create index if not exists nova_messages_created_idx on public.nova_messages(created_at);

alter table public.nova_messages enable row level security;

drop policy if exists "nova_messages_read_members" on public.nova_messages;
create policy "nova_messages_read_members"
on public.nova_messages
for select
using (public.is_project_member(project_id));

drop policy if exists "nova_messages_write_admin" on public.nova_messages;
create policy "nova_messages_write_admin"
on public.nova_messages
for all
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =============================
-- LLM usage (optional, written by nova.agi service role)
-- =============================
create table if not exists public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'global',
  actor text not null default 'nova',
  provider text,
  model text,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists llm_usage_project_idx on public.llm_usage(project_id);

alter table public.llm_usage enable row level security;

drop policy if exists "llm_usage_read_admin" on public.llm_usage;
create policy "llm_usage_read_admin"
on public.llm_usage
for select
using (public.is_project_admin(project_id));