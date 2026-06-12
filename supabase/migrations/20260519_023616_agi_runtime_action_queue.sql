-- HOCKER ONE — AGI Runtime Queue Schema
-- Phase: 12.7B-2 DB Fix
-- Purpose: enable GitHub Write-Gate plans to be queued safely.
-- Safe: create-if-not-exists, no destructive changes.

create extension if not exists pgcrypto;

create table if not exists public.agi_agents (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  name text not null,
  role text,
  status text not null default 'registered',
  autonomy_level text not null default 'manual',
  allow_actions boolean not null default false,
  capabilities jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, agi_id)
);

create table if not exists public.agi_tools (
  id uuid primary key default gen_random_uuid(),
  tool_key text not null unique,
  name text not null,
  provider text,
  category text,
  status text not null default 'missing_key',
  requires_secret_keys jsonb not null default '[]'::jsonb,
  supports_read boolean not null default false,
  supports_write boolean not null default false,
  supports_realtime boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_agent_tools (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  tool_key text not null,
  permission_level text not null default 'read_guarded',
  enabled boolean not null default false,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, agi_id, tool_key)
);

create table if not exists public.agi_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  title text not null,
  details text,
  status text not null default 'review',
  priority text not null default 'normal',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  assigned_to text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  tool_key text,
  task_id uuid,
  action_id uuid,
  status text not null default 'created',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_action_queue (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  tool_key text,
  action_type text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  risk_level text not null default 'medium',
  dry_run boolean not null default true,
  requires_approval boolean not null default true,
  status text not null default 'needs_approval',
  created_by uuid,
  approved_by uuid,
  rejected_by uuid,
  executed_by uuid,
  approval_note text,
  rejection_note text,
  execution_result jsonb not null default '{}'::jsonb,
  execution_error text,
  rollback_plan jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  rejected_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text,
  action_id uuid,
  run_id uuid,
  feedback_type text not null default 'note',
  rating int,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null default 'nova',
  title text,
  status text not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agi_action_queue_project_status_idx
  on public.agi_action_queue(project_id, status, created_at desc);

create index if not exists agi_action_queue_tool_idx
  on public.agi_action_queue(tool_key, action_type, created_at desc);

create index if not exists agi_runs_project_idx
  on public.agi_runs(project_id, agi_id, created_at desc);

create index if not exists agi_tasks_project_idx
  on public.agi_tasks(project_id, status, created_at desc);

alter table public.agi_agents enable row level security;
alter table public.agi_tools enable row level security;
alter table public.agi_agent_tools enable row level security;
alter table public.agi_tasks enable row level security;
alter table public.agi_runs enable row level security;
alter table public.agi_action_queue enable row level security;
alter table public.agi_feedback enable row level security;
alter table public.agi_chat_threads enable row level security;

-- No public policies are added here.
-- Server-side access should use SUPABASE_SERVICE_ROLE_KEY.
