create or replace function public.complete_serverless_agi_execution(
  p_task_id uuid,
  p_worker_id text,
  p_run_id uuid,
  p_output jsonb,
  p_evidence jsonb,
  p_result_hash text
)
returns table(task_id uuid, run_id uuid, status text, result_hash text)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_task public.agi_tasks%rowtype;
  v_run public.agi_runs%rowtype;
begin
  if p_worker_id is null or btrim(p_worker_id) = '' then
    raise exception 'VERIFIED_WORKER_ID_REQUIRED';
  end if;
  if p_result_hash is null or p_result_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'VERIFIED_RESULT_HASH_REQUIRED';
  end if;
  if jsonb_typeof(p_evidence) <> 'array' or jsonb_array_length(p_evidence) = 0 then
    raise exception 'VERIFIED_EVIDENCE_REQUIRED';
  end if;

  update public.agi_tasks task
  set
    status = 'completed',
    output = coalesce(p_output, '{}'::jsonb),
    evidence = p_evidence,
    result_hash = p_result_hash,
    completed_at = now(),
    last_heartbeat_at = now(),
    error = null,
    updated_at = now()
  where task.id = p_task_id
    and task.status = 'working'
    and task.lock_owner = p_worker_id
  returning task.* into v_task;

  if not found then
    return;
  end if;

  update public.agi_runs run
  set
    status = 'completed',
    output = coalesce(p_output, '{}'::jsonb),
    evidence = p_evidence,
    result_hash = p_result_hash,
    error = null,
    finished_at = now()
  where run.id = p_run_id
    and run.task_id = p_task_id
    and run.status = 'running'
    and run.worker_id = p_worker_id
    and nullif(run.provider, '') is not null
    and nullif(run.model, '') is not null
  returning run.* into v_run;

  if not found then
    raise exception 'VERIFIED_RUN_NOT_OWNED_OR_INCOMPLETE';
  end if;

  return query select v_task.id, v_run.id, v_task.status, v_task.result_hash;
end;
$function$;

revoke all on function public.complete_serverless_agi_execution(uuid,text,uuid,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.complete_serverless_agi_execution(uuid,text,uuid,jsonb,jsonb,text) to service_role;

comment on function public.complete_serverless_agi_execution(uuid,text,uuid,jsonb,jsonb,text) is
  'Atomically completes a locked AGI task and its verified model run. Requires provider, model, worker, SHA-256 result hash and non-empty evidence.';
