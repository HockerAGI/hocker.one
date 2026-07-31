-- HOCKER ONE — Verifiable AGI Worker Lifecycle V1
-- Purpose: turn agi_tasks/agi_runs into a claimable, auditable worker queue.
-- Safety: additive migration; no destructive changes; server-only RPC execution.

alter table public.agi_tasks
  add column if not exists request_id text,
  add column if not exists task_type text not null default 'analysis',
  add column if not exists input jsonb not null default '{}'::jsonb,
  add column if not exists output jsonb not null default '{}'::jsonb,
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists error text,
  add column if not exists trace_id text,
  add column if not exists parent_message_id text,
  add column if not exists requires_approval boolean not null default false,
  add column if not exists write_policy text not null default 'draft_only',
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists locked_at timestamptz,
  add column if not exists lock_owner text,
  add column if not exists started_at timestamptz,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists result_hash text;

alter table public.agi_runs
  add column if not exists trace_id text,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists attempt integer not null default 1,
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists result_hash text,
  add column if not exists worker_id text;

do $$
begin
  alter table public.agi_tasks
    add constraint agi_tasks_attempts_valid
    check (attempt_count >= 0 and max_attempts between 1 and 10);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.agi_tasks
    add constraint agi_tasks_write_policy_valid
    check (write_policy in ('read_only', 'draft_only', 'owner_gate'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists agi_tasks_project_idempotency_uidx
  on public.agi_tasks(project_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists agi_tasks_worker_claim_idx
  on public.agi_tasks(project_id, status, assigned_to, priority, created_at)
  where status = 'queued';

create index if not exists agi_tasks_lock_recovery_idx
  on public.agi_tasks(project_id, locked_at)
  where status = 'working';

create index if not exists agi_runs_task_created_idx
  on public.agi_runs(task_id, created_at desc);

create or replace function public.claim_next_agi_task(
  p_project_id text,
  p_worker_id text,
  p_assigned_agi text default null
)
returns setof public.agi_tasks
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_project_id), '') is null then
    raise exception 'project_id_required';
  end if;

  if nullif(trim(p_worker_id), '') is null then
    raise exception 'worker_id_required';
  end if;

  return query
  with candidate as (
    select task.id
    from public.agi_tasks task
    where task.project_id = p_project_id
      and task.status = 'queued'
      and task.attempt_count < task.max_attempts
      and (
        p_assigned_agi is null
        or task.assigned_to = p_assigned_agi
        or task.agi_id = p_assigned_agi
      )
    order by
      case task.priority
        when 'critical' then 0
        when 'high' then 1
        when 'normal' then 2
        when 'low' then 3
        else 4
      end,
      task.created_at asc
    for update skip locked
    limit 1
  )
  update public.agi_tasks task
  set
    status = 'working',
    locked_at = now(),
    lock_owner = p_worker_id,
    started_at = coalesce(task.started_at, now()),
    last_heartbeat_at = now(),
    attempt_count = task.attempt_count + 1,
    error = null,
    updated_at = now()
  from candidate
  where task.id = candidate.id
  returning task.*;
end;
$$;

create or replace function public.heartbeat_agi_task(
  p_task_id uuid,
  p_worker_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.agi_tasks
  set last_heartbeat_at = now(), updated_at = now()
  where id = p_task_id
    and status = 'working'
    and lock_owner = p_worker_id;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.complete_agi_task(
  p_task_id uuid,
  p_worker_id text,
  p_output jsonb,
  p_evidence jsonb,
  p_result_hash text
)
returns setof public.agi_tasks
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.agi_tasks task
  set
    status = 'completed',
    output = coalesce(p_output, '{}'::jsonb),
    evidence = coalesce(p_evidence, '[]'::jsonb),
    result_hash = nullif(trim(p_result_hash), ''),
    error = null,
    completed_at = now(),
    locked_at = null,
    lock_owner = null,
    last_heartbeat_at = now(),
    updated_at = now()
  where task.id = p_task_id
    and task.status = 'working'
    and task.lock_owner = p_worker_id
  returning task.*;
end;
$$;

create or replace function public.fail_agi_task(
  p_task_id uuid,
  p_worker_id text,
  p_error text,
  p_evidence jsonb default '[]'::jsonb
)
returns setof public.agi_tasks
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.agi_tasks task
  set
    status = case
      when task.attempt_count < task.max_attempts then 'queued'
      else 'failed'
    end,
    error = left(coalesce(p_error, 'agi_worker_failed'), 4000),
    evidence = coalesce(p_evidence, task.evidence, '[]'::jsonb),
    locked_at = null,
    lock_owner = null,
    last_heartbeat_at = now(),
    updated_at = now()
  where task.id = p_task_id
    and task.status = 'working'
    and task.lock_owner = p_worker_id
  returning task.*;
end;
$$;

create or replace function public.recover_stale_agi_tasks(
  p_project_id text,
  p_stale_after interval default interval '10 minutes'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.agi_tasks task
  set
    status = case
      when task.attempt_count < task.max_attempts then 'queued'
      else 'failed'
    end,
    error = coalesce(task.error, 'stale_worker_lock_recovered'),
    locked_at = null,
    lock_owner = null,
    updated_at = now()
  where task.project_id = p_project_id
    and task.status = 'working'
    and coalesce(task.last_heartbeat_at, task.locked_at, task.started_at, task.updated_at) < now() - p_stale_after;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.claim_next_agi_task(text, text, text) from public, anon, authenticated;
revoke all on function public.heartbeat_agi_task(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_agi_task(uuid, text, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.fail_agi_task(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.recover_stale_agi_tasks(text, interval) from public, anon, authenticated;

grant execute on function public.claim_next_agi_task(text, text, text) to service_role;
grant execute on function public.heartbeat_agi_task(uuid, text) to service_role;
grant execute on function public.complete_agi_task(uuid, text, jsonb, jsonb, text) to service_role;
grant execute on function public.fail_agi_task(uuid, text, text, jsonb) to service_role;
grant execute on function public.recover_stale_agi_tasks(text, interval) to service_role;

comment on function public.claim_next_agi_task(text, text, text)
  is 'Atomically claims one queued AGI task using FOR UPDATE SKIP LOCKED.';
comment on function public.complete_agi_task(uuid, text, jsonb, jsonb, text)
  is 'Completes only the task currently locked by the requesting worker and stores evidence.';
comment on function public.fail_agi_task(uuid, text, text, jsonb)
  is 'Requeues or permanently fails a locked task according to max_attempts.';
