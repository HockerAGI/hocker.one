-- HOCKER ONE: at most ONE authentic Free-only specialist canary per UTC day.
-- Reuses the existing task/run/event schema and atomic completion worker RPC.
-- Fixed HOSTIA identity; never touches generic claim_next_agi_task or paid router.
CREATE OR REPLACE FUNCTION public.start_free_readonly_hostia_pilot_v1(
  p_project_id text,
  p_owner_id uuid,
  p_worker_id text
) RETURNS TABLE(task_id uuid, run_id uuid, snapshot jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$
DECLARE
  v_task uuid;
  v_run uuid;
  v_date text := to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  v_key text := 'free-specialist-v1:' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  v_agents integer;
  v_actions integer;
  v_occupied integer;
  v_snapshot jsonb;
BEGIN
  IF p_project_id IS DISTINCT FROM 'hocker-one'
    OR p_owner_id IS NULL
    OR p_worker_id IS NULL
    OR p_worker_id !~ '^hocker-free-specialist:[a-f0-9-]{36}$'
    OR NOT EXISTS (
      SELECT 1 FROM public.project_members m
      WHERE m.project_id = p_project_id
        AND m.user_id = p_owner_id
        AND m.role = 'owner'
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.agi_agents a
      WHERE a.project_id = p_project_id AND a.agi_id='hostia'
        AND a.allow_actions IS FALSE
    )
  THEN
    RAISE EXCEPTION 'FREE_SPECIALIST_OWNER_OR_AGENT_SCOPE_REJECTED';
  END IF;

  -- Owner's current AAL2 and same-origin checks occur in the API BEFORE RPC.
  -- Count-only queue gate must be checked again atomically for race safety.
  IF EXISTS (
    SELECT 1 FROM public.agi_tasks t
    WHERE t.project_id=p_project_id
      AND t.status IN ('queued','pending')
      AND t.created_at < now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'FREE_SPECIALIST_STALE_BACKLOG_BLOCKED';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (WHERE a.allow_actions)::integer
    INTO v_agents, v_actions
    FROM public.agi_agents a WHERE a.project_id=p_project_id;
  IF v_agents <> 16 OR v_actions <> 0 THEN
    RAISE EXCEPTION 'FREE_SPECIALIST_AGENT_GATES_UNAVAILABLE';
  END IF;

  SELECT count(*)::integer INTO v_occupied
    FROM public.agi_tasks t
    WHERE t.project_id=p_project_id AND t.status IN ('queued','pending','working');
  IF v_occupied <> 0 THEN
    RAISE EXCEPTION 'FREE_SPECIALIST_QUEUE_NOT_EMPTY';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.agi_tasks t
    WHERE t.project_id=p_project_id AND t.idempotency_key=v_key
  ) THEN
    RAISE EXCEPTION 'FREE_SPECIALIST_ALREADY_RUN_TODAY';
  END IF;

  v_snapshot := jsonb_build_object(
    'source','supabase_live_readonly',
    'observed_at',now(),
    'project_id',p_project_id,
    'registered_agis',v_agents,
    'allow_actions_true',v_actions,
    'queued_or_pending_or_working',v_occupied,
    'specialist','hostia',
    'scope','only_supabase_counts_not_live_infrastructure_or_autonomy'
  );

  INSERT INTO public.agi_tasks(
    project_id, agi_id, assigned_to, title, details,
    status, priority, task_type, input, payload, output, evidence,
    created_by, requires_approval, write_policy,
    attempt_count, max_attempts, idempotency_key,
    locked_at, lock_owner, started_at, last_heartbeat_at
  ) VALUES (
    p_project_id,'hostia','hostia','HOSTIA - análisis de infraestructura solo lectura (Free)',
    'Analizar solo conteos y limitaciones del snapshot autentificado; sin herramientas ni modificaciones.',
    'working','normal','analysis',
    jsonb_build_object('snapshot',v_snapshot,'no_tools',true),
    jsonb_build_object('source','hocker-free-readonly-specialist-v1',
      'scope','one_hostia_analysis','no_external_actions',true,'free_only',true),
    '{}'::jsonb,'[]'::jsonb,
    p_owner_id,false,'draft_only',
    1,1,v_key,now(),p_worker_id,now(),now()
  ) RETURNING id INTO v_task;

  INSERT INTO public.agi_runs(
    project_id,agi_id,tool_key,task_id,status,input,output,error,
    started_at,trace_id,provider,model,attempt,worker_id,evidence
  ) VALUES (
    p_project_id,'hostia','cloudflare-workers-ai',v_task,'running',
    jsonb_build_object('snapshot',v_snapshot,'free_only',true,'no_tools',true,
      'specialist','hostia'),
    '{}'::jsonb,null,now(),pg_catalog.gen_random_uuid()::text,
    'cloudflare-workers-ai','@cf/zai-org/glm-4.7-flash',1,
    p_worker_id,'[]'::jsonb
  ) RETURNING id INTO v_run;

  INSERT INTO public.events(project_id,node_id,level,type,message,data)
  VALUES (
    p_project_id,NULL,'info','agi.free_specialist.owner_started',
    'Owner AAL2 requested one bounded HOSTIA Free-only analysis',
    jsonb_build_object('task_id',v_task,'run_id',v_run,'owner_id',p_owner_id,
      'date_utc',v_date,'scope','one_hostia_analysis','no_tools',true)
  );

  RETURN QUERY SELECT v_task,v_run,v_snapshot;
END;
$function$;

REVOKE ALL ON FUNCTION public.start_free_readonly_hostia_pilot_v1(text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_free_readonly_hostia_pilot_v1(text,uuid,text)
  TO service_role;
