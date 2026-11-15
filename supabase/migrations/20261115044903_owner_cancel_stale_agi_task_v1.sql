-- HOCKER ONE Owner review: one stale AGI task per explicit MFA AAL2 decision.
-- No mass cancel; never change created_at or delete payload / run / evidence history.
-- SECURITY DEFINER is exposed only to service_role; HTTP route separately verifies
-- authenticated Owner membership + current Supabase MFA AAL2.
CREATE OR REPLACE FUNCTION public.owner_cancel_stale_agi_task_v1(
  p_project_id text,
  p_task_id uuid,
  p_owner_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$
DECLARE
  v_task public.agi_tasks%ROWTYPE;
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF p_project_id IS DISTINCT FROM 'hocker-one'
    OR p_task_id IS NULL
    OR p_owner_id IS NULL
    OR length(v_reason) < 12
    OR length(v_reason) > 400 THEN
    RAISE EXCEPTION 'AGI_STALE_TASK_REVIEW_INVALID';
  END IF;

  SELECT * INTO v_task FROM public.agi_tasks
  WHERE project_id = p_project_id AND id = p_task_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AGI_STALE_TASK_NOT_FOUND';
  END IF;
  IF v_task.status NOT IN ('queued', 'pending')
    OR v_task.created_at >= now() - interval '24 hours'
    OR v_task.locked_at IS NOT NULL
    OR v_task.lock_owner IS NOT NULL
    OR coalesce(v_task.requires_approval, false)
    OR v_task.write_policy <> 'draft_only'
    OR v_task.task_type <> 'analysis' THEN
    RAISE EXCEPTION 'AGI_STALE_TASK_NOT_ELIGIBLE';
  END IF;

  UPDATE public.agi_tasks
  SET status = 'canceled',
      updated_at = now(),
      error = 'OWNER_CANCELED_STALE_AGI_TASK'
  WHERE id = v_task.id AND project_id = p_project_id
    AND status = v_task.status;

  -- Same DB transaction: if audit insert fails, task status is rolled back.
  INSERT INTO public.events(project_id, node_id, level, type, message, data)
  VALUES (
    p_project_id, NULL, 'info', 'agi.task.owner_canceled',
    'Stale draft-only AGI task canceled after individual Owner review',
    pg_catalog.jsonb_build_object(
      'task_id', v_task.id,
      'previous_status', v_task.status,
      'task_created_at', v_task.created_at,
      'agi_id', v_task.agi_id,
      'attempt_count', v_task.attempt_count,
      'owner_user_id', p_owner_id,
      'reason', v_reason,
      'approved_scope', 'single_stale_analysis_task',
      'result', 'canceled_without_execution'
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'ok', true,
    'task_id', v_task.id,
    'previous_status', v_task.status,
    'status', 'canceled',
    'preserved_history', true,
    'audit_recorded', true
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.owner_cancel_stale_agi_task_v1(text,uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owner_cancel_stale_agi_task_v1(text,uuid,uuid,text) TO service_role;
