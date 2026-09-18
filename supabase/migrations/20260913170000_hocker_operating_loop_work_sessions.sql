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

-- Atomic creation: session row + initial event are committed together.
create or replace function public.hocker_create_work_session(
  p_project_id text,
  p_created_by uuid,
  p_thread_id uuid default null,
  p_mission_id text default null,
  p_idempotency_key text default null,
  p_meta jsonb default '{}'::jsonb
)
returns public.hocker_work_sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.hocker_work_sessions;
  v_existing public.hocker_work_sessions;
begin
  if p_created_by is distinct from auth.uid() then
    raise exception 'WORK_SESSION_ACTOR_MISMATCH';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing
    from public.hocker_work_sessions
    where project_id = p_project_id
      and idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return v_existing;
    end if;
  end if;

  insert into public.hocker_work_sessions (
    project_id, thread_id, mission_id, state, idempotency_key, meta, created_by
  ) values (
    p_project_id, p_thread_id, p_mission_id, 'planning', p_idempotency_key, coalesce(p_meta, '{}'::jsonb), p_created_by
  ) returning * into v_row;

  insert into public.hocker_work_session_events (
    work_session_id, project_id, sequence, event_type, from_state, to_state,
    actor_user_id, idempotency_key, meta
  ) values (
    v_row.id, v_row.project_id, 0, 'created', null, 'planning',
    p_created_by,
    case when p_idempotency_key is null then null else p_idempotency_key || ':created' end,
    '{}'::jsonb
  );

  return v_row;
exception
  when unique_violation then
    if p_idempotency_key is not null then
      select * into v_existing
      from public.hocker_work_sessions
      where project_id = p_project_id
        and idempotency_key = p_idempotency_key
      limit 1;
      if found then
        return v_existing;
      end if;
    end if;
    raise;
end;
$$;

-- Atomic transition: row lock + state/version update + append-only event.
create or replace function public.hocker_transition_work_session(
  p_project_id text,
  p_work_session_id uuid,
  p_to_state text,
  p_actor_user_id uuid,
  p_event_type text default 'state_changed',
  p_idempotency_key text default null,
  p_meta jsonb default '{}'::jsonb
)
returns public.hocker_work_sessions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current public.hocker_work_sessions;
  v_existing public.hocker_work_session_events;
  v_updated public.hocker_work_sessions;
  v_next_version integer;
begin
  if p_actor_user_id is distinct from auth.uid() then
    raise exception 'WORK_SESSION_ACTOR_MISMATCH';
  end if;

  select * into v_current
  from public.hocker_work_sessions
  where project_id = p_project_id
    and id = p_work_session_id
  for update;

  if not found then
    raise exception 'WORK_SESSION_NOT_FOUND';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing
    from public.hocker_work_session_events
    where work_session_id = v_current.id
      and idempotency_key = p_idempotency_key
    limit 1;
    if found then
      return v_current;
    end if;
  end if;

  if not (
    (v_current.state = 'planning' and p_to_state in ('researching','blocked','canceled')) or
    (v_current.state = 'researching' and p_to_state in ('ready','blocked','failed','canceled')) or
    (v_current.state = 'ready' and p_to_state in ('awaiting_owner','executing','blocked','canceled')) or
    (v_current.state = 'awaiting_owner' and p_to_state in ('approved','blocked','canceled')) or
    (v_current.state = 'approved' and p_to_state in ('executing','blocked','canceled')) or
    (v_current.state = 'executing' and p_to_state in ('verifying','failed','blocked')) or
    (v_current.state = 'verifying' and p_to_state in ('completed','failed','blocked')) or
    (v_current.state = 'blocked' and p_to_state in ('planning','canceled')) or
    (v_current.state = 'failed' and p_to_state in ('planning','canceled'))
  ) then
    raise exception 'INVALID_WORK_SESSION_TRANSITION:%->%', v_current.state, p_to_state;
  end if;

  v_next_version := v_current.version + 1;

  update public.hocker_work_sessions
  set state = p_to_state,
      version = v_next_version
  where id = v_current.id
    and project_id = p_project_id
  returning * into v_updated;

  insert into public.hocker_work_session_events (
    work_session_id, project_id, sequence, event_type, from_state, to_state,
    actor_user_id, idempotency_key, meta
  ) values (
    v_current.id, p_project_id, v_next_version, coalesce(p_event_type, 'state_changed'),
    v_current.state, p_to_state, p_actor_user_id, p_idempotency_key, coalesce(p_meta, '{}'::jsonb)
  );

  return v_updated;
end;
$$;

revoke all on function public.hocker_create_work_session(text, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.hocker_transition_work_session(text, uuid, text, uuid, text, text, jsonb) from public;
grant execute on function public.hocker_create_work_session(text, uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.hocker_transition_work_session(text, uuid, text, uuid, text, text, jsonb) to authenticated;
