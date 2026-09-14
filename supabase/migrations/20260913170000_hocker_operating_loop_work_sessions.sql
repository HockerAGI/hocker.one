-- HOCKER Operating Loop v1 — Work Session persistence envelope.
-- References existing session/task/run/action/evidence identifiers; does not duplicate their payloads.

create table if not exists public.hocker_work_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  thread_id uuid null,
  mission_id text null,
  state text not null default 'planning'
    check (state in ('planning','researching','ready','awaiting_owner','approved','executing','verifying','completed','blocked','failed','canceled')),
  candidate_id text null,
  run_id uuid null references public.agi_runs(id) on delete set null,
  task_id uuid null references public.agi_tasks(id) on delete set null,
  action_id uuid null references public.agi_action_queue(id) on delete set null,
  evidence_id uuid null,
  idempotency_key text null,
  version integer not null default 0 check (version >= 0),
  meta jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, idempotency_key)
);

create table if not exists public.hocker_work_session_events (
  id uuid primary key default gen_random_uuid(),
  work_session_id uuid not null references public.hocker_work_sessions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  event_type text not null,
  from_state text null,
  to_state text null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  idempotency_key text null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (work_session_id, sequence),
  unique (work_session_id, idempotency_key)
);

create index if not exists hocker_work_sessions_project_updated_idx
  on public.hocker_work_sessions(project_id, updated_at desc);
create index if not exists hocker_work_sessions_project_state_idx
  on public.hocker_work_sessions(project_id, state, updated_at desc);
create index if not exists hocker_work_sessions_thread_idx
  on public.hocker_work_sessions(project_id, thread_id, updated_at desc)
  where thread_id is not null;
create index if not exists hocker_work_session_events_project_created_idx
  on public.hocker_work_session_events(project_id, created_at desc);
create index if not exists hocker_work_session_events_session_sequence_idx
  on public.hocker_work_session_events(work_session_id, sequence desc);

alter table public.hocker_work_sessions enable row level security;
alter table public.hocker_work_session_events enable row level security;

create policy "hocker_work_sessions_select_member"
  on public.hocker_work_sessions for select to authenticated
  using (public.is_project_member(project_id));
create policy "hocker_work_sessions_insert_operator"
  on public.hocker_work_sessions for insert to authenticated
  with check (public.is_project_operator(project_id));
create policy "hocker_work_sessions_update_operator"
  on public.hocker_work_sessions for update to authenticated
  using (public.is_project_operator(project_id))
  with check (public.is_project_operator(project_id));
create policy "hocker_work_sessions_delete_owner"
  on public.hocker_work_sessions for delete to authenticated
  using (public.is_project_owner(project_id));

create policy "hocker_work_session_events_select_member"
  on public.hocker_work_session_events for select to authenticated
  using (public.is_project_member(project_id));
create policy "hocker_work_session_events_insert_operator"
  on public.hocker_work_session_events for insert to authenticated
  with check (public.is_project_operator(project_id));

create or replace trigger hocker_work_sessions_updated_at
  before update on public.hocker_work_sessions
  for each row execute function public.tg_set_updated_at();
