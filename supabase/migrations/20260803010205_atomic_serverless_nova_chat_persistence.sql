create or replace function public.persist_serverless_nova_chat(
  p_thread_id uuid,
  p_project_id text,
  p_user_id uuid,
  p_title text,
  p_user_content text,
  p_assistant_content text,
  p_user_meta jsonb,
  p_assistant_meta jsonb,
  p_provider text,
  p_model text,
  p_tokens_in integer,
  p_tokens_out integer,
  p_usage_meta jsonb
)
returns table(
  thread_id uuid,
  user_message_id uuid,
  assistant_message_id uuid,
  usage_id uuid
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_thread public.nova_threads%rowtype;
  v_user_message_id uuid;
  v_assistant_message_id uuid;
  v_usage_id uuid;
begin
  if p_thread_id is null then raise exception 'NOVA_THREAD_ID_REQUIRED'; end if;
  if p_project_id is null or btrim(p_project_id) = '' then raise exception 'NOVA_PROJECT_ID_REQUIRED'; end if;
  if p_user_id is null then raise exception 'NOVA_USER_ID_REQUIRED'; end if;
  if p_user_content is null or btrim(p_user_content) = '' then raise exception 'NOVA_USER_CONTENT_REQUIRED'; end if;
  if p_assistant_content is null or btrim(p_assistant_content) = '' then raise exception 'NOVA_ASSISTANT_CONTENT_REQUIRED'; end if;
  if p_provider is null or btrim(p_provider) = '' then raise exception 'NOVA_PROVIDER_REQUIRED'; end if;
  if p_model is null or btrim(p_model) = '' then raise exception 'NOVA_MODEL_REQUIRED'; end if;

  select thread.*
  into v_thread
  from public.nova_threads thread
  where thread.thread_id = p_thread_id
  for update;

  if found then
    if coalesce(v_thread.project_id, '') <> p_project_id
      or v_thread.user_id is distinct from p_user_id then
      raise exception 'NOVA_THREAD_ACCESS_DENIED';
    end if;

    update public.nova_threads
    set title = left(coalesce(nullif(btrim(p_title), ''), title), 240), updated_at = now()
    where id = v_thread.id;
  else
    insert into public.nova_threads (thread_id, project_id, user_id, title, updated_at)
    values (p_thread_id, p_project_id, p_user_id, left(nullif(btrim(p_title), ''), 240), now())
    returning * into v_thread;
  end if;

  insert into public.nova_messages (project_id, thread_id, role, content, meta)
  values (p_project_id, p_thread_id::text, 'user', p_user_content, coalesce(p_user_meta, '{}'::jsonb))
  returning id into v_user_message_id;

  insert into public.nova_messages (project_id, thread_id, role, content, meta)
  values (p_project_id, p_thread_id::text, 'assistant', p_assistant_content, coalesce(p_assistant_meta, '{}'::jsonb))
  returning id into v_assistant_message_id;

  insert into public.llm_usage (project_id, thread_id, provider, model, tokens_in, tokens_out, meta)
  values (
    p_project_id,
    p_thread_id::text,
    p_provider,
    p_model,
    p_tokens_in,
    p_tokens_out,
    coalesce(p_usage_meta, '{}'::jsonb)
  )
  returning id into v_usage_id;

  return query select p_thread_id, v_user_message_id, v_assistant_message_id, v_usage_id;
end;
$function$;

revoke all on function public.persist_serverless_nova_chat(uuid,text,uuid,text,text,text,jsonb,jsonb,text,text,integer,integer,jsonb) from public, anon, authenticated;
grant execute on function public.persist_serverless_nova_chat(uuid,text,uuid,text,text,text,jsonb,jsonb,text,text,integer,integer,jsonb) to service_role;

comment on function public.persist_serverless_nova_chat(uuid,text,uuid,text,text,text,jsonb,jsonb,text,text,integer,integer,jsonb) is
  'Atomically validates thread ownership and persists the thread, user message, assistant message and LLM usage row.';

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
  if p_worker_id is null or btrim(p_worker_id) = '' then raise exception 'VERIFIED_WORKER_ID_REQUIRED'; end if;
  if p_result_hash is null or p_result_hash !~ '^[a-f0-9]{64}$' then raise exception 'VERIFIED_RESULT_HASH_REQUIRED'; end if;
  if jsonb_typeof(p_evidence) <> 'array' or jsonb_array_length(p_evidence) = 0 then raise exception 'VERIFIED_EVIDENCE_REQUIRED'; end if;

  update public.agi_tasks task
  set
    status = 'completed',
    output = coalesce(p_output, '{}'::jsonb),
    evidence = p_evidence,
    result_hash = p_result_hash,
    completed_at = now(),
    last_heartbeat_at = now(),
    locked_at = null,
    lock_owner = null,
    error = null,
    updated_at = now()
  where task.id = p_task_id
    and task.status = 'working'
    and task.lock_owner = p_worker_id
  returning task.* into v_task;

  if not found then return; end if;

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

  if not found then raise exception 'VERIFIED_RUN_NOT_OWNED_OR_INCOMPLETE'; end if;

  return query select v_task.id, v_run.id, v_task.status, v_task.result_hash;
end;
$function$;

revoke all on function public.complete_serverless_agi_execution(uuid,text,uuid,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.complete_serverless_agi_execution(uuid,text,uuid,jsonb,jsonb,text) to service_role;
