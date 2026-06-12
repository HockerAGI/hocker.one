-- HOCKER core hardening
-- Idempotent migration for Hocker ONE, NOVA, SYNTIA, node agents and future Chido integration.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  status text not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  node_id text,
  actor_id text,
  actor_type text not null default 'system',
  action text not null,
  target_type text,
  target_id text,
  level text not null default 'info',
  message text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.nova_messages
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table if exists public.events
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table if exists public.nodes
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table if exists public.commands
  add column if not exists signature text;

alter table if exists public.commands
  add column if not exists needs_approval boolean not null default false;

alter table if exists public.commands
  add column if not exists approved_at timestamptz;

create index if not exists idx_events_project_type_created
  on public.events (project_id, type, created_at desc);

create index if not exists idx_nodes_project_status
  on public.nodes (project_id, status);

create index if not exists idx_commands_project_node_status
  on public.commands (project_id, node_id, status, created_at desc);

create index if not exists idx_nova_messages_thread_created
  on public.nova_messages (thread_id, created_at asc);

create index if not exists idx_audit_logs_project_created
  on public.audit_logs (project_id, created_at desc);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'nova_messages'
  ) then
    begin
      alter table public.nova_messages
        drop constraint if exists nova_messages_role_check;
    exception when others then
      null;
    end;

    begin
      alter table public.nova_messages
        add constraint nova_messages_role_check
        check (role in ('system', 'user', 'assistant', 'tool', 'nova'));
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

insert into public.audit_logs (
  project_id,
  actor_type,
  action,
  target_type,
  level,
  message,
  data
)
values (
  'hocker-one',
  'migration',
  'hocker.core.hardening',
  'supabase',
  'info',
  'Supabase hardening migration registered for Hocker ONE, NOVA, SYNTIA, node agents and future Chido integration.',
  jsonb_build_object(
    'migration', '20260502_0003_hocker_core_hardening',
    'source', 'hocker.one'
  )
)
on conflict do nothing;
