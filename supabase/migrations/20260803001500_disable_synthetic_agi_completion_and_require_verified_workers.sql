-- Synthetic scheduler rows created without a provider, model, worker, hash or
-- evidence are retained for audit, but they must never count as verified AGI work.

update public.agi_runs
set
  status = 'legacy_synthetic',
  error = 'LEGACY_SYNTHETIC_RUN_NO_MODEL_WORKER_OR_EVIDENCE',
  output = coalesce(output, '{}'::jsonb) || jsonb_build_object(
    'synthetic', true,
    'verified_execution', false,
    'remediated_at', now(),
    'remediation', 'Historical scheduler row reclassified; no provider, model, worker, result hash or evidence was present.'
  )
where provider is null
  and model is null
  and worker_id is null
  and result_hash is null
  and coalesce(jsonb_array_length(evidence), 0) = 0
  and coalesce(output->>'source', '') in ('run_hocker_autonomous_scheduler', 'run_queued_agi_runs');

update public.agi_tasks task
set
  status = 'failed',
  error = 'LEGACY_SYNTHETIC_TASK_NO_VERIFIED_EXECUTION',
  completed_at = null,
  output = coalesce(task.output, '{}'::jsonb) || jsonb_build_object(
    'synthetic', true,
    'verified_execution', false,
    'remediated_at', now()
  ),
  evidence = coalesce(task.evidence, '[]'::jsonb),
  updated_at = now()
where exists (
  select 1
  from public.agi_runs run
  where run.task_id = task.id
    and run.status = 'legacy_synthetic'
);

update public.agi_learning_events learning
set
  status = 'blocked',
  risk_level = 'high',
  prevents_error = true,
  error_pattern = 'synthetic_scheduler_completion_without_provider_model_worker_or_evidence',
  recommended_action = 'Do not use this record as learning. Re-run the originating task with a verified worker and evidence.',
  reviewed_by = 'system-remediation',
  reviewed_at = now(),
  updated_at = now()
where learning.source_module = 'run_hocker_autonomous_scheduler';

update public.agi_memory_mirror memory
set
  active = false,
  safety_status = 'blocked',
  approved_by_nova = false,
  approved_by_syntia = false,
  approved_by_vertx = false,
  approved_by_jurix = false,
  memory_payload = coalesce(memory.memory_payload, '{}'::jsonb) || jsonb_build_object(
    'synthetic', true,
    'verified_execution', false,
    'blocked_at', now(),
    'block_reason', 'Derived from a synthetic scheduler completion.'
  ),
  updated_at = now()
where exists (
  select 1
  from public.agi_learning_events learning
  where learning.id = memory.learning_event_id
    and learning.source_module = 'run_hocker_autonomous_scheduler'
);

create or replace function public.dispatch_agi_tasks(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_dispatched integer := 0;
begin
  with candidates as (
    select task.id
    from public.agi_tasks task
    join public.agis agi on agi.id = task.agi_id
    where task.project_id = 'hocker-one'
      and task.status in ('pending', 'review')
      and coalesce(agi.meta->>'status', 'active') <> 'planned'
      and task.attempt_count < task.max_attempts
    order by
      case task.priority
        when 'critical' then 0
        when 'high' then 1
        when 'normal' then 2
        when 'medium' then 2
        when 'low' then 3
        else 4
      end,
      task.created_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    for update of task skip locked
  )
  update public.agi_tasks task
  set status = 'queued', error = null, updated_at = now()
  from candidates
  where task.id = candidates.id;

  get diagnostics v_dispatched = row_count;
  return v_dispatched;
end;
$function$;

comment on function public.dispatch_agi_tasks(integer) is
  'Queues eligible AGI tasks only. It never creates or completes agi_runs; verified workers own execution evidence.';

create or replace function public.run_queued_agi_runs(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_waiting integer := 0;
begin
  select count(*)::integer
  into v_waiting
  from (
    select task.id
    from public.agi_tasks task
    join public.agis agi on agi.id = task.agi_id
    where task.project_id = 'hocker-one'
      and task.status = 'queued'
      and coalesce(agi.meta->>'status', 'active') <> 'planned'
      and task.attempt_count < task.max_attempts
    order by task.created_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  ) waiting;

  return v_waiting;
end;
$function$;

comment on function public.run_queued_agi_runs(integer) is
  'Compatibility read-only queue count. Synthetic run completion was disabled; only a verified worker may complete tasks.';

create or replace function public.run_hocker_autonomous_scheduler(
  p_window_hours integer default 24,
  p_limit integer default 100,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_tasks integer := 0;
begin
  with eligible_agis as (
    select
      agi.id,
      agi.name,
      coalesce(agi.meta->>'status', 'active') as registry_status
    from public.agis agi
    where coalesce(agi.meta->>'status', 'active') <> 'planned'
      and (
        p_force
        or not exists (
          select 1
          from public.agi_runs run
          where run.project_id = 'hocker-one'
            and run.agi_id = agi.id
            and run.status = 'completed'
            and nullif(run.provider, '') is not null
            and nullif(run.model, '') is not null
            and nullif(run.worker_id, '') is not null
            and nullif(run.result_hash, '') is not null
            and jsonb_typeof(run.evidence) = 'array'
            and jsonb_array_length(run.evidence) > 0
            and coalesce(run.finished_at, run.created_at) >= now() - make_interval(hours => greatest(1, p_window_hours))
        )
      )
      and not exists (
        select 1
        from public.agi_tasks task
        where task.project_id = 'hocker-one'
          and task.agi_id = agi.id
          and task.status in ('queued', 'working', 'pending', 'review')
      )
    order by agi.id
    limit greatest(1, least(coalesce(p_limit, 100), 100))
  )
  insert into public.agi_tasks (
    project_id, agi_id, title, details, status, priority, payload,
    assigned_to, due_at, request_id, task_type, input, output, evidence,
    requires_approval, write_policy, attempt_count, max_attempts,
    idempotency_key, created_at, updated_at
  )
  select
    'hocker-one',
    eligible.id,
    eligible.name || ' · verified scheduler pulse',
    'Real worker task. Completion requires provider, model, worker_id, result_hash and evidence.',
    'queued',
    'normal',
    jsonb_build_object(
      'kind', 'verified_scheduler_pulse',
      'source', 'run_hocker_autonomous_scheduler',
      'agi_id', eligible.id,
      'agi_name', eligible.name,
      'registry_status', eligible.registry_status,
      'window_hours', greatest(1, p_window_hours),
      'force', p_force,
      'synthetic_completion_disabled', true
    ),
    eligible.id,
    now() + interval '15 minutes',
    gen_random_uuid()::text,
    'analysis',
    jsonb_build_object(
      'objective', 'Produce a truthful operational pulse for this AGI using a real model and verifiable evidence.',
      'constraints', jsonb_build_array(
        'Do not execute external writes.',
        'Report missing tools or evidence explicitly.',
        'Return a concise status, findings and next actions.'
      )
    ),
    '{}'::jsonb,
    '[]'::jsonb,
    false,
    'draft_only',
    0,
    3,
    'verified-scheduler:' || eligible.id || ':' || to_char(date_trunc('hour', now()), 'YYYYMMDDHH24'),
    now(),
    now()
  from eligible_agis eligible;

  get diagnostics v_tasks = row_count;

  return jsonb_build_object(
    'ok', true,
    'tasks_created', v_tasks,
    'runs_queued', 0,
    'runs_completed', 0,
    'learning_events_written', 0,
    'memory_mirror_written', 0,
    'synthetic_completion_disabled', true,
    'execution_required', 'verified_worker'
  );
end;
$function$;

comment on function public.run_hocker_autonomous_scheduler(integer, integer, boolean) is
  'Enqueues real AGI pulse tasks only. Never fabricates runs, completions, learning or memory.';

revoke all on function public.dispatch_agi_tasks(integer) from public, anon, authenticated;
revoke all on function public.run_queued_agi_runs(integer) from public, anon, authenticated;
revoke all on function public.run_hocker_autonomous_scheduler(integer, integer, boolean) from public, anon, authenticated;

grant execute on function public.dispatch_agi_tasks(integer) to service_role;
grant execute on function public.run_queued_agi_runs(integer) to service_role;
grant execute on function public.run_hocker_autonomous_scheduler(integer, integer, boolean) to service_role;
