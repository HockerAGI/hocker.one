create extension if not exists pgcrypto;

create table if not exists public.agi_agents (
  project_id text not null,
  agi_id text not null,
  name text not null,
  role text not null default 'agent',
  status text not null default 'registered',
  autonomy_level text not null default 'guarded',
  allow_actions boolean not null default false,
  capabilities text[] not null default '{}',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, agi_id)
);

create table if not exists public.agi_tools (
  tool_key text primary key,
  name text not null,
  provider text not null,
  category text not null default 'integration',
  status text not null default 'catalog',
  requires_secret_keys text[] not null default '{}',
  supports_read boolean not null default true,
  supports_write boolean not null default false,
  supports_realtime boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_agent_tools (
  project_id text not null,
  agi_id text not null,
  tool_key text not null references public.agi_tools(tool_key) on delete cascade,
  permission_level text not null default 'read',
  enabled boolean not null default false,
  policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, agi_id, tool_key)
);

create table if not exists public.agi_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  title text not null,
  description text,
  status text not null default 'queued',
  priority text not null default 'normal',
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  task_id uuid references public.agi_tasks(id) on delete set null,
  status text not null default 'queued',
  mode text not null default 'dry_run',
  started_at timestamptz,
  finished_at timestamptz,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  trace_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_action_queue (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  tool_key text,
  action_type text not null,
  title text not null,
  status text not null default 'needs_approval',
  risk_level text not null default 'medium',
  requires_approval boolean not null default true,
  dry_run boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  approved_by uuid,
  approved_at timestamptz,
  executed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  agi_id text not null,
  run_id uuid references public.agi_runs(id) on delete set null,
  action_id uuid references public.agi_action_queue(id) on delete set null,
  rating integer,
  label text,
  notes text,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  title text,
  mode text not null default 'auto',
  tool_scope text[] not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  thread_id uuid references public.agi_chat_threads(id) on delete cascade,
  role text not null,
  content text not null,
  agi_id text,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.agi_integration_checks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  tool_key text not null,
  status text not null default 'untested',
  configured boolean not null default false,
  last_checked_at timestamptz not null default now(),
  latency_ms integer,
  message text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists agi_action_queue_project_status_idx on public.agi_action_queue(project_id, status, created_at desc);
create index if not exists agi_tasks_project_status_idx on public.agi_tasks(project_id, status, created_at desc);
create index if not exists agi_runs_project_agi_idx on public.agi_runs(project_id, agi_id, created_at desc);
create index if not exists agi_chat_messages_thread_idx on public.agi_chat_messages(thread_id, created_at asc);
create index if not exists agi_integration_checks_project_tool_idx on public.agi_integration_checks(project_id, tool_key, last_checked_at desc);

alter table public.agi_agents enable row level security;
alter table public.agi_tools enable row level security;
alter table public.agi_agent_tools enable row level security;
alter table public.agi_tasks enable row level security;
alter table public.agi_runs enable row level security;
alter table public.agi_action_queue enable row level security;
alter table public.agi_feedback enable row level security;
alter table public.agi_chat_threads enable row level security;
alter table public.agi_chat_messages enable row level security;
alter table public.agi_integration_checks enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='agi_agents' and policyname='agi_agents_project_members_read') then
    create policy agi_agents_project_members_read on public.agi_agents for select using (
      exists (select 1 from public.project_members pm where pm.project_id = agi_agents.project_id and pm.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='agi_tools' and policyname='agi_tools_authenticated_read') then
    create policy agi_tools_authenticated_read on public.agi_tools for select using (auth.uid() is not null);
  end if;
end $$;
