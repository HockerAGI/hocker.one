-- Derive AI Gateway health only from completed/failed real runs.
create or replace function public.sync_ai_gateway_health_from_run()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_gateway boolean := new.provider = 'vercel-ai-gateway';
  is_verified_success boolean := false;
  is_auth_failure boolean := false;
  latency integer := null;
  check_status text;
  check_message text;
begin
  if not is_gateway or new.status not in ('completed','failed') then
    return new;
  end if;

  is_verified_success :=
    new.status = 'completed'
    and nullif(trim(coalesce(new.model,'')), '') is not null
    and nullif(trim(coalesce(new.worker_id,'')), '') is not null
    and coalesce(new.result_hash,'') ~ '^[a-f0-9]{64}$'
    and jsonb_typeof(coalesce(new.evidence,'[]'::jsonb)) = 'array'
    and exists (
      select 1
      from jsonb_array_elements(coalesce(new.evidence,'[]'::jsonb)) item
      where item->>'kind' = 'verified_model_completion'
        and item->>'provider' = 'vercel-ai-gateway'
        and coalesce(item->>'input_sha256','') ~ '^[a-f0-9]{64}$'
        and coalesce(item->>'output_sha256','') ~ '^[a-f0-9]{64}$'
        and coalesce((item->>'external_writes_executed')::boolean,false) = false
    );

  is_auth_failure :=
    new.status = 'failed'
    and (
      coalesce(new.error,'') ilike '%authentication failed%'
      or coalesce(new.error,'') ilike '%unauthorized%'
      or coalesce(new.error,'') ilike '%forbidden%'
      or coalesce(new.error,'') ilike '%AI_GATEWAY_AUTH%'
    );

  if not is_verified_success and not is_auth_failure then
    return new;
  end if;

  if new.started_at is not null and new.finished_at is not null then
    latency := greatest(0, floor(extract(epoch from (new.finished_at-new.started_at))*1000)::integer);
  end if;

  if is_verified_success then
    check_status := 'healthy';
    check_message := 'Verified AI Gateway model completion recorded automatically.';
  else
    check_status := 'auth_failed';
    check_message := 'Real AI Gateway run was rejected by authentication.';
  end if;

  insert into public.agi_integration_checks(
    project_id,tool_key,status,configured,last_checked_at,latency_ms,message,meta
  ) values (
    new.project_id,
    'ai_gateway',
    check_status,
    true,
    coalesce(new.finished_at,now()),
    latency,
    check_message,
    jsonb_build_object(
      'provider',new.provider,
      'model',new.model,
      'run_id',new.id,
      'task_id',new.task_id,
      'agi_id',new.agi_id,
      'result_hash',case when is_verified_success then new.result_hash else null end,
      'verified_completion',is_verified_success,
      'gateway_auth_error',is_auth_failure,
      'canon_version',coalesce(new.input->>'canon_version','12.6C.1B'),
      'secret_material_logged',false
    )
  );

  update public.agi_tools
  set
    status = case when is_verified_success then 'connected' else 'partial' end,
    meta = meta || jsonb_build_object(
      'implementation_status','executor_ready',
      'execution_enabled',is_verified_success,
      'status_label',case when is_verified_success then 'Conectado' else 'Parcial' end,
      'status_hint',check_message,
      'last_verified_at',coalesce(new.finished_at,now()),
      'last_verified_run_id',new.id,
      'last_verified_result_hash',case when is_verified_success then new.result_hash else null end
    ),
    updated_at = now()
  where tool_key = 'ai_gateway';

  update public.agi_agent_tools
  set
    enabled = is_verified_success and agi_id <> 'shadows',
    policy = policy || jsonb_build_object(
      'execution_enabled',is_verified_success and agi_id <> 'shadows',
      'normalized_status',case when is_verified_success then 'connected' else 'partial' end,
      'implementation_status','executor_ready',
      'last_verified_run_id',new.id,
      'last_verification',check_status
    ),
    updated_at = now()
  where project_id = new.project_id
    and tool_key = 'ai_gateway';

  return new;
end;
$$;

drop trigger if exists sync_ai_gateway_health_from_run on public.agi_runs;
create trigger sync_ai_gateway_health_from_run
after insert or update of status,error,provider,model,worker_id,result_hash,evidence,finished_at
on public.agi_runs
for each row
execute function public.sync_ai_gateway_health_from_run();

revoke all on function public.sync_ai_gateway_health_from_run() from public,anon,authenticated;
grant execute on function public.sync_ai_gateway_health_from_run() to service_role;

comment on function public.sync_ai_gateway_health_from_run() is
'Fail-closed health automation. AI Gateway is enabled only after evidence-backed verified_model_completion.';
