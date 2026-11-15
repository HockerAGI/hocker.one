-- HOCKER ONE: One evidence-only NOVA free-tier canary per UTC day.
-- The existing generic queue is NOT used. Insert both a task in "working"
-- and its run in one DB transaction after Owner AAL2 has been checked by HTTP.
-- Only service_role can invoke; no external tools or action approval changes.
CREATE OR REPLACE FUNCTION public.start_free_readonly_agi_pilot_v1(
  p_project_id text,
  p_owner_id uuid,
  p_worker_id text
) RETURNS TABLE(task_id uuid, run_id uuid, snapshot jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$
DECLARE
  v_id uuid;
  v_run uuid;
  v_key text;
  v_date text := to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  v_agents integer;
  v_actions integer;
  v_queued integer;
  v_snapshot jsonb;
BEGIN
  IF p_project_id IS DISTINCT FROM 'hocker-one'
    OR p_owner_id IS NULL
    OR p_worker_id IS NULL
    OR p_worker_id !~ '^hocker-free-pilot:[a-f0-9-]{36}$'
    OR NOT EXISTS (
      SELECT 1 FROM public.project_members m
      WHERE m.project_id = p_project_id
        AND m.user_id = p_owner_id
        AND m.role = 'owner'
    ) THEN
    RAISE EXCEPTION 'FREE_PILOT_OWNER_SCOPE_REJECTED';
  END IF;

  -- No old tasks may be silently replayed. The API also performs the
  -- project-wide 24h count-only preflight before calling this RPC.
  IF EXISTS (
    SELECT 1 FROM public.agi_tasks t
    WHERE t.project_id=p_project_id
      AND t.status IN ('queued','pending')
      AND t.created_at < now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'FREE_PILOT_STALE_BACKLOG_BLOCKED';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (WHERE a.allow_actions)::integer
    INTO v_agents, v_actions
    FROM public.agi_agents a WHERE a.project_id=p_project_id;
  IF v_agents <> 16 OR v_actions <> 0 THEN
    RAISE EXCEPTION 'FREE_PILOT_AGENT_GATES_UNAVAILABLE';
  END IF;

  SELECT count(*)::integer INTO v_queued FROM public.agi_tasks t
  WHERE t.project_id=p_project_id AND t.status IN ('queued','pending');
  IF v_queued <> 0 THEN
    RAISE EXCEPTION 'FREE_PILOT_QUEUE_NOT_EMPTY';
  END IF;

  v_key := 'free-pilot-v1:' || v_date; -- Per-project daily uniqueness.
  IF EXISTS (SELECT 1 FROM public.agi_tasks t
             WHERE t.project_id=p_project_id AND t.idempotency_key=v_key) THEN
    RAISE EXCEPTION 'FREE_PILOT_ALREADY_RUN_TODAY';
  END IF;

  v_snapshot := jsonb_build_object(
    'source','supabase_live_readonly',
    'observed_at',now(),
    'project_id',p_project_id,
    'registered_agis',v_agents,
    'allow_actions_true',v_actions,
    'queued_or_pending',v_queued,
    'scope','only_supabase_counts_not_runtime_or_full_autonomy'
  );

  INSERT INTO public.agi_tasks(
    project_id, agi_id, assigned_to, title, details,
    status, priority, task_type, input, payload, output, evidence,
    created_by, requires_approval, write_policy,
    attempt_count, max_attempts, idempotency_key,
    locked_at, lock_owner, started_at, last_heartbeat_at
  ) VALUES (
    p_project_id,'nova','nova','NOVA - analisis real de control AGI, solo lectura',
    'Evaluar exclusivamente el snapshot autenticado. Sin herramientas ni acciones.',
    'working','normal','analysis',
    jsonb_build_object('snapshot',v_snapshot,'no_tools',true),
    jsonb_build_object('source','hocker-free-readonly-pilot-v1','scope','evidence_only','no_external_actions',true),
    '{}'::jsonb,'[]'::jsonb,
    p_owner_id,false,'draft_only',
    1,1,v_key,
    now(),p_worker_id,now(),now()
  ) RETURNING id INTO v_id;

  INSERT INTO public.agi_runs(
    project_id,agi_id,tool_key,task_id,status,input,output,error,
    started_at,trace_id,provider,model,attempt,worker_id,evidence
  ) VALUES (
    p_project_id,'nova','cloudflare-workers-ai',v_id,'running',
    jsonb_build_object('snapshot',v_snapshot,'free_only',true,'no_tools',true),
    '{}'::jsonb,null,
    now(),pg_catalog.gen_random_uuid()::text,
    'cloudflare-workers-ai','@cf/zai-org/glm-4.7-flash',1,
    p_worker_id,'[]'::jsonb
  ) RETURNING id INTO v_run;

  -- Atomic audit; if it fails neither task nor run can be created.
  INSERT INTO public.events(project_id,node_id,level,type,message,data)
  VALUES(
    p_project_id,NULL,'info','agi.free_pilot.owner_started',
    'Owner AAL2 requested a single no-tools free-tier NOVA analysis',
    jsonb_build_object('task_id',v_id,'run_id',v_run,'owner_id',p_owner_id,
      'date_utc',v_date,'scope','evidence_only','model','@cf/zai-org/glm-4.7-flash')
  );
  RETURN QUERY SELECT v_id,v_run,v_snapshot;
END;
$function$;

REVOKE ALL ON FUNCTION public.start_free_readonly_agi_pilot_v1(text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_free_readonly_agi_pilot_v1(text,uuid,text)
  TO service_role;
