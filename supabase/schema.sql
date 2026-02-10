-- ============================================
-- HOCKER.ONE — Supabase Schema (multi-project)
-- Commands + Events + Governance + Nova threads
-- ============================================

-- Extensions
create extension if not exists pgcrypto;

-- Keep things predictable
set search_path = public;

-- =========================
-- Helpers (roles/membership)
-- =========================

create or replace function public.is_project_member(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

create or replace function public.is_project_owner(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- =========================
-- Profiles (Supabase Auth)
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ==================================
-- Projects + Membership (multi-project)
-- ==================================

create table if not exists public.projects (
  id text primary key,
  name text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects_select_if_member" on public.projects;
create policy "projects_select_if_member"
on public.projects
for select
to authenticated
using (public.is_project_member(id));

drop policy if exists "projects_insert_admin" on public.projects;
create policy "projects_insert_admin"
on public.projects
for insert
to authenticated
with check (true); -- membership check is typically handled by app logic

drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner"
on public.projects
for update
to authenticated
using (public.is_project_owner(id))
with check (public.is_project_owner(id));

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_idx on public.project_members(user_id);

alter table public.project_members enable row level security;

drop policy if exists "project_members_select_if_member" on public.project_members;
create policy "project_members_select_if_member"
on public.project_members
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "project_members_insert_owner" on public.project_members;
create policy "project_members_insert_owner"
on public.project_members
for insert
to authenticated
with check (public.is_project_owner(project_id));

drop policy if exists "project_members_update_owner" on public.project_members;
create policy "project_members_update_owner"
on public.project_members
for update
to authenticated
using (public.is_project_owner(project_id))
with check (public.is_project_owner(project_id));

drop policy if exists "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (public.is_project_owner(project_id));

-- =========================
-- Nodes (agents / runners)
-- =========================

create table if not exists public.nodes (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text,
  tags text[] not null default '{}',
  last_seen_at timestamptz,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nodes_project_idx on public.nodes(project_id);

alter table public.nodes enable row level security;

drop policy if exists "nodes_select_if_member" on public.nodes;
create policy "nodes_select_if_member"
on public.nodes
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "nodes_insert_admin" on public.nodes;
create policy "nodes_insert_admin"
on public.nodes
for insert
to authenticated
with check (public.is_project_admin(project_id));

drop policy if exists "nodes_update_admin" on public.nodes;
create policy "nodes_update_admin"
on public.nodes
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

drop policy if exists "nodes_delete_owner" on public.nodes;
create policy "nodes_delete_owner"
on public.nodes
for delete
to authenticated
using (public.is_project_owner(project_id));

-- =========================
-- Governance / Controls
-- =========================

create table if not exists public.system_controls (
  id text not null default 'global',
  project_id text not null references public.projects(id) on delete cascade,
  kill_switch boolean not null default false,
  allow_write boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (id, project_id)
);

alter table public.system_controls enable row level security;

drop policy if exists "system_controls_select_if_member" on public.system_controls;
create policy "system_controls_select_if_member"
on public.system_controls
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "system_controls_upsert_owner" on public.system_controls;
create policy "system_controls_upsert_owner"
on public.system_controls
for insert
to authenticated
with check (public.is_project_owner(project_id));

drop policy if exists "system_controls_update_owner" on public.system_controls;
create policy "system_controls_update_owner"
on public.system_controls
for update
to authenticated
using (public.is_project_owner(project_id))
with check (public.is_project_owner(project_id));

-- =========================
-- Commands (control plane)
-- =========================

create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  node_id text references public.nodes(id) on delete set null,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('needs_approval','queued','running','done','failed','cancelled')),
  needs_approval boolean not null default false,
  signature text,
  result jsonb,
  error text,
  approved_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists commands_project_idx on public.commands(project_id);
create index if not exists commands_node_idx on public.commands(node_id);
create index if not exists commands_status_idx on public.commands(status);

alter table public.commands enable row level security;

drop policy if exists "commands_select_if_member" on public.commands;
create policy "commands_select_if_member"
on public.commands
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "commands_insert_admin" on public.commands;
create policy "commands_insert_admin"
on public.commands
for insert
to authenticated
with check (public.is_project_admin(project_id));

drop policy if exists "commands_update_admin" on public.commands;
create policy "commands_update_admin"
on public.commands
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- =========================
-- Events (audit-friendly)
-- =========================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  node_id text references public.nodes(id) on delete set null,
  level text not null default 'info' check (level in ('info','warn','error')),
  type text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_project_idx on public.events(project_id);
create index if not exists events_level_idx on public.events(level);
create index if not exists events_created_idx on public.events(created_at);

alter table public.events enable row level security;

drop policy if exists "events_select_if_member" on public.events;
create policy "events_select_if_member"
on public.events
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "events_insert_admin" on public.events;
create policy "events_insert_admin"
on public.events
for insert
to authenticated
with check (public.is_project_admin(project_id));

-- =========================
-- Audit logs (server-side app can write)
-- =========================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_project_idx on public.audit_logs(project_id);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_owner" on public.audit_logs;
create policy "audit_logs_select_owner"
on public.audit_logs
for select
to authenticated
using (
  project_id is null
  or public.is_project_owner(project_id)
);

-- =========================
-- AGIs registry (optional)
-- =========================

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

-- =========================
-- Nova conversation persistence
-- =========================

create table if not exists public.nova_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists nova_threads_project_idx on public.nova_threads(project_id);

alter table public.nova_threads enable row level security;

drop policy if exists "nova_threads_select_if_member" on public.nova_threads;
create policy "nova_threads_select_if_member"
on public.nova_threads
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "nova_threads_insert_if_member" on public.nova_threads;
create policy "nova_threads_insert_if_member"
on public.nova_threads
for insert
to authenticated
with check (public.is_project_member(project_id));

drop policy if exists "nova_threads_update_if_member" on public.nova_threads;
create policy "nova_threads_update_if_member"
on public.nova_threads
for update
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create table if not exists public.nova_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  thread_id uuid not null references public.nova_threads(id) on delete cascade,
  role text not null check (role in ('system','user','assistant','nova')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists nova_messages_thread_idx on public.nova_messages(thread_id);
create index if not exists nova_messages_project_idx on public.nova_messages(project_id);

alter table public.nova_messages enable row level security;

drop policy if exists "nova_messages_select_if_member" on public.nova_messages;
create policy "nova_messages_select_if_member"
on public.nova_messages
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "nova_messages_insert_if_member" on public.nova_messages;
create policy "nova_messages_insert_if_member"
on public.nova_messages
for insert
to authenticated
with check (public.is_project_member(project_id));

-- =========================
-- LLM usage (optional)
-- =========================

create table if not exists public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  provider text not null,
  model text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists llm_usage_project_idx on public.llm_usage(project_id);

alter table public.llm_usage enable row level security;

drop policy if exists "llm_usage_select_if_member" on public.llm_usage;
create policy "llm_usage_select_if_member"
on public.llm_usage
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "llm_usage_insert_admin" on public.llm_usage;
create policy "llm_usage_insert_admin"
on public.llm_usage
for insert
to authenticated
with check (public.is_project_admin(project_id));

-- =========================
-- Auth trigger: create profile + global project + membership
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  base_role text;
  has_profiles boolean;
begin
  -- first user becomes owner; later users default operator
  select exists(select 1 from public.profiles) into has_profiles;
  base_role := case when has_profiles then 'operator' else 'owner' end;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, base_role)
  on conflict (id) do update set email = excluded.email;

  -- ensure global project exists
  insert into public.projects (id, name)
  values ('global', 'Global')
  on conflict (id) do nothing;

  -- ensure membership to global
  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, base_role)
  on conflict (project_id, user_id) do update set role = excluded.role;

  -- ensure controls row exists
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

-- ============================================
-- End
-- ============================================