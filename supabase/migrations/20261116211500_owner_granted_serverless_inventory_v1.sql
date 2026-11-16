-- HOCKER ONE: one Owner MFA AAL2-approved, count-only serverless inventory / UTC day.
-- No model/provider call, MCP/tool call, network request or material external action.
-- The existing coordinator gets a DISTINCT narrow read/write token at the API edge.
-- These RPCs are service_role-only and never use generic claim_next_agi_task.
--
-- Each RPC is a single database transaction: approval + task creation and
-- snapshot execution + task/run/evidence/events complete or roll back together.
CREATE OR REPLACE FUNCTION public.owner_schedule_free_inventory_v1(
  p_project_id text, p_owner_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','extensions','pg_temp'
AS $function$
DECLARE
  v_date text := pg_catalog.to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  v_key text;
  v_task_id uuid;
  v_agents integer;
  v_grants integer;
  v_busy integer;
  v_actions integer;
BEGIN
  IF p_project_id IS DISTINCT FROM 'hocker-one'
     OR p_owner_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.project_members m
       WHERE m.project_id=p_project_id AND m.user_id=p_owner_id AND m.role='owner'
     ) THEN
    RAISE EXCEPTION 'FREE_INVENTORY_OWNER_SCOPE_REJECTED';
  END IF;

  -- Serializes all approvals and executions against a project-specific lock.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('hocker-one:owner-free-inventory-v1')::bigint
  );
  v_key := 'owner-free-inventory-v1:' || v_date;
  IF EXISTS (SELECT 1 FROM public.agi_tasks
             WHERE project_id=p_project_id AND idempotency_key=v_key) THEN
    RAISE EXCEPTION 'FREE_INVENTORY_ALREADY_AUTHORIZED_TODAY';
  END IF;

  SELECT count(*)::int, count(*) FILTER (WHERE allow_actions IS TRUE)::int
  INTO v_agents, v_grants
  FROM public.agi_agents WHERE project_id=p_project_id;
  SELECT count(*)::int INTO v_busy FROM public.agi_tasks
  WHERE project_id=p_project_id AND status IN ('queued','pending','working');
  SELECT count(*)::int INTO v_actions FROM public.agi_action_queue
  WHERE project_id=p_project_id AND status IN (
    'needs_approval','approved','queued','dry_run_queued','running','executing',
    'execution_failed','failed','error','needs_fix','review'
  );
  IF v_agents <> 16 OR v_grants <> 0 OR v_busy <> 0 OR v_actions <> 0 THEN
    RAISE EXCEPTION 'FREE_INVENTORY_OWNER_PREFLIGHT_BLOCKED';
  END IF;

  -- This is the exact, immutable approval scope. No prompts or model requests.
  INSERT INTO public.agi_tasks(
    project_id,agi_id,assigned_to,title,details,status,priority,task_type,
    input,payload,output,evidence,created_by,requires_approval,write_policy,
    attempt_count,max_attempts,idempotency_key
  ) VALUES (
    p_project_id,'nova','nova','NOVA · inventario automático autorizado',
    'Leer únicamente conteos actuales de Supabase. No ejecutar modelos, herramientas ni escrituras externas.',
    'queued','normal','analysis',
    pg_catalog.jsonb_build_object('scope','supabase_count_only','model_calls',0,'tools',false),
    pg_catalog.jsonb_build_object(
      'source','owner-aal2-serverless-inventory-v1',
      'preauthorized_exact_scope',true,'no_paid_fallback',true,
      'no_model',true,'no_tools',true,'no_external_actions',true
    ),
    '{}'::jsonb,'[]'::jsonb,p_owner_id,false,'draft_only',0,1,v_key
  ) RETURNING id INTO v_task_id;

  INSERT INTO public.events(project_id,node_id,level,type,message,data)
  VALUES (p_project_id,NULL,'info','agi.free_inventory.owner_approved',
    'Owner AAL2 authorized one count-only Supabase inventory (no model)',
    pg_catalog.jsonb_build_object('task_id',v_task_id,'scope','supabase_count_only',
      'one_time',true,'model_calls',0,'date_utc',v_date));

  RETURN pg_catalog.jsonb_build_object('ok',true,'authorized',true,
    'task_id',v_task_id,'status','queued','model_requests',0,
    'write_policy','draft_only','one_task_per_day',true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_owner_free_inventory_v1(
  p_project_id text, p_worker_id text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','extensions','pg_temp'
AS $function$
DECLARE
  v_key text;
  v_task public.agi_tasks%ROWTYPE;
  v_agents integer;
  v_grants integer;
  v_busy integer;
  v_actions integer;
  v_runs integer;
  v_recent_nodes integer;
  v_now timestamptz;
  v_output jsonb;
  v_evidence jsonb;
  v_hash text;
  v_run_id uuid;
BEGIN
  IF p_project_id IS DISTINCT FROM 'hocker-one'
     OR p_worker_id IS NULL
     OR p_worker_id !~ '^hocker-free-inventory:[a-f0-9-]{36}$' THEN
    RAISE EXCEPTION 'FREE_INVENTORY_WORKER_SCOPE_REJECTED';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('hocker-one:owner-free-inventory-v1')::bigint
  );
  v_key := 'owner-free-inventory-v1:' ||
    pg_catalog.to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD');
  SELECT * INTO v_task FROM public.agi_tasks
  WHERE project_id=p_project_id AND idempotency_key=v_key
    AND status='queued'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('ok',true,'processed',false,
      'reason','NO_OWNER_APPROVED_INVENTORY','model_requests',0,'task_claims',0);
  END IF;

  IF v_task.created_at < now() - interval '20 minutes' THEN
    UPDATE public.agi_tasks
    SET status='canceled',error='FREE_INVENTORY_APPROVAL_EXPIRED',
      updated_at=now()
    WHERE id=v_task.id AND project_id=p_project_id AND status='queued';
    INSERT INTO public.events(project_id,node_id,level,type,message,data)
    VALUES(p_project_id,NULL,'info','agi.free_inventory.approval_expired',
      'One-time approval expired without execution',
      pg_catalog.jsonb_build_object('task_id',v_task.id,'model_calls',0));
    RETURN pg_catalog.jsonb_build_object('ok',true,'processed',false,
      'reason','OWNER_APPROVAL_EXPIRED','model_requests',0,'task_claims',0);
  END IF;

  IF v_task.agi_id IS DISTINCT FROM 'nova'
    OR v_task.assigned_to IS DISTINCT FROM 'nova'
    OR v_task.write_policy IS DISTINCT FROM 'draft_only'
    OR v_task.task_type IS DISTINCT FROM 'analysis'
    OR v_task.requires_approval IS DISTINCT FROM false
    OR v_task.attempt_count IS DISTINCT FROM 0
    OR v_task.max_attempts IS DISTINCT FROM 1
    OR v_task.locked_at IS NOT NULL OR v_task.lock_owner IS NOT NULL
    OR v_task.input->>'scope' IS DISTINCT FROM 'supabase_count_only'
    OR v_task.input->>'model_calls' IS DISTINCT FROM '0'
    OR v_task.payload->>'source' IS DISTINCT FROM 'owner-aal2-serverless-inventory-v1'
    OR v_task.payload->>'preauthorized_exact_scope' IS DISTINCT FROM 'true'
    OR v_task.payload->>'no_model' IS DISTINCT FROM 'true'
    OR v_task.payload->>'no_tools' IS DISTINCT FROM 'true'
    OR v_task.payload->>'no_external_actions' IS DISTINCT FROM 'true'
    OR v_task.created_by IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.project_members m
      WHERE m.project_id=p_project_id AND m.user_id=v_task.created_by AND m.role='owner'
    ) THEN
    RAISE EXCEPTION 'FREE_INVENTORY_AUTHORIZATION_EVIDENCE_INVALID';
  END IF;

  SELECT count(*)::int, count(*) FILTER (WHERE allow_actions IS TRUE)::int
  INTO v_agents,v_grants FROM public.agi_agents WHERE project_id=p_project_id;
  SELECT count(*)::int INTO v_busy FROM public.agi_tasks
  WHERE project_id=p_project_id AND status IN ('queued','pending','working');
  SELECT count(*)::int INTO v_actions FROM public.agi_action_queue
  WHERE project_id=p_project_id AND status IN (
    'needs_approval','approved','queued','dry_run_queued','running','executing',
    'execution_failed','failed','error','needs_fix','review'
  );
  IF v_agents<>16 OR v_grants<>0 OR v_busy<>1 OR v_actions<>0 THEN
    RAISE EXCEPTION 'FREE_INVENTORY_DISPATCH_PREFLIGHT_BLOCKED';
  END IF;
  IF EXISTS(SELECT 1 FROM public.agi_tasks
    WHERE project_id=p_project_id AND status IN ('queued','pending')
      AND created_at < now()-interval '24 hours') THEN
    RAISE EXCEPTION 'FREE_INVENTORY_STALE_BACKLOG_BLOCKED';
  END IF;

  SELECT count(*)::int INTO v_runs FROM public.agi_runs
    WHERE project_id=p_project_id AND status='completed';
  SELECT count(*)::int INTO v_recent_nodes FROM public.nodes
    WHERE project_id=p_project_id AND last_seen_at > now()-interval '5 minutes';

  v_now := pg_catalog.clock_timestamp();
  v_output := pg_catalog.jsonb_build_object(
    'ok',true,'verified_execution',true,
    'kind','verified_serverless_supabase_inventory_no_model',
    'source','supabase_live_count_only','project_id',p_project_id,
    'task_id',v_task.id,'agi_id','nova','collected_at',v_now,
    'registered_agi_profiles',v_agents,
    'globally_enabled_material_agents',v_grants,
    'active_tasks_at_capture',v_busy,
    'blocked_material_actions',v_actions,
    'completed_run_count',v_runs,
    'fresh_node_records_5m',v_recent_nodes,
    'model_requests',0,'tools_executed',0,
    'external_writes_executed',false,'no_paid_fallback',true,
    'dedicated_runtime_verified',false
  );
  -- v_output::text is the canonical PostgreSQL JSONB serialization for
  -- cross-checking this specific database-produced snapshot.
  v_hash := pg_catalog.encode(extensions.digest(v_output::text,'sha256'),'hex');
  v_run_id := pg_catalog.gen_random_uuid();
  v_evidence := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
    'kind','verified_serverless_supabase_inventory_no_model',
    'task_id',v_task.id,'run_id',v_run_id,'agi_id','nova',
    'worker_id',p_worker_id,'output_sha256',v_hash,
    'hash_codec','postgres_jsonb_text_v1','source','supabase_live_count_only',
    'model_requests',0,'tools_executed',0,
    'external_writes_executed',false
  ));

  UPDATE public.agi_tasks SET status='completed',attempt_count=1,
    lock_owner=p_worker_id,locked_at=v_now,started_at=v_now,
    last_heartbeat_at=v_now,updated_at=v_now,completed_at=v_now,
    output=v_output,evidence=v_evidence,result_hash=v_hash
  WHERE id=v_task.id AND project_id=p_project_id AND status='queued';

  INSERT INTO public.agi_runs(
    id,project_id,agi_id,tool_key,task_id,status,input,output,
    started_at,finished_at,trace_id,provider,model,attempt,
    worker_id,evidence,result_hash
  ) VALUES (
    v_run_id,p_project_id,'nova',NULL,v_task.id,'completed',
    pg_catalog.jsonb_build_object('scope','supabase_count_only',
      'source','owner_approved_serverless_cron','no_model',true),
    v_output,v_now,v_now,v_run_id::text,'supabase-readonly-inventory',
    NULL,1,p_worker_id,v_evidence,v_hash
  );

  INSERT INTO public.events(project_id,node_id,level,type,message,data)
  VALUES(p_project_id,NULL,'info','agi.free_inventory.cron_completed',
    'Cron completed Owner-approved count-only snapshot without model',
    pg_catalog.jsonb_build_object(
      'task_id',v_task.id,'run_id',v_run_id,
      'output_sha256',v_hash,'model_calls',0,
      'scope','one_owner_approved_inventory'
    ));

  RETURN pg_catalog.jsonb_build_object(
    'ok',true,'processed',true,'task_id',v_task.id,
    'run_id',v_run_id,'status','completed','result_hash',v_hash,
    'model_requests',0,'tools_executed',0,
    'external_writes_executed',false,'no_paid_fallback',true,
    'source','supabase_live_count_only'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.owner_schedule_free_inventory_v1(text,uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.owner_schedule_free_inventory_v1(text,uuid)
  TO service_role;
REVOKE ALL ON FUNCTION public.run_owner_free_inventory_v1(text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_owner_free_inventory_v1(text,text)
  TO service_role;
