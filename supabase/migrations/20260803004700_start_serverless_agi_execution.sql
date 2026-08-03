create or replace function public.start_serverless_agi_execution(
  p_task_id uuid,
  p_project_id text,
  p_agi_id text,
  p_worker_id text,
  p_provider text,
  p_model text,
  p_input jsonb,
  p_trace_id text,
  p_attempt integer default 1
)
returns table(run_id uuid)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_run_id uuid;
begin
  if p_worker_id is null or btrim(p_worker_id) = '' then
    raise exception 'VERIFIED_WORKER_ID_REQUIRED';
  end if;
  if p_provider is null or btrim(p_provider) = '' then
    raise exception 'VERIFIED_PROVIDER_REQUIRED';
  end if;
  if p_model is null or btrim(p_model) = '' then
    raise exception 'VERIFIED_MODEL_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.agi_tasks task
    where task.id = p_task_id
      and task.project_id = p_project_id
      and task.status = 'working'
      and task.lock_owner = p_worker_id
      and coalesce(task.agi_id, p_agi_id) = p_agi_id
  ) then
    raise exception 'VERIFIED_TASK_NOT_OWNED';
  end if;

  insert into public.agi_runs (
    project_id,
    agi_id,
    tool_key,
    task_id,
    status,
    input,
    output,
    error,
    started_at,
    trace_id,
    provider,
    model,
    attempt,
    worker_id,
    evidence
  )
  values (
    p_project_id,
    p_agi_id,
    p_provider,
    p_task_id,
    'running',
    coalesce(p_input, '{}'::jsonb),
    '{}'::jsonb,
    null,
    now(),
    nullif(btrim(p_trace_id), ''),
    p_provider,
    p_model,
    greatest(1, coalesce(p_attempt, 1)),
    p_worker_id,
    '[]'::jsonb
  )
  returning id into v_run_id;

  return query select v_run_id;
end;
$function$;

revoke all on function public.start_serverless_agi_execution(uuid,text,text,text,text,text,jsonb,text,integer) from public, anon, authenticated;
grant execute on function public.start_serverless_agi_execution(uuid,text,text,text,text,text,jsonb,text,integer) to service_role;

comment on function public.start_serverless_agi_execution(uuid,text,text,text,text,text,jsonb,text,integer) is
  'Starts a verified AGI run only when the matching task is working and locked by the same worker. Provider, model and worker are mandatory.';
