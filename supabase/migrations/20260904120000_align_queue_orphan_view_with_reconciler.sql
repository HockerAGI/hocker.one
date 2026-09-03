-- Keep the operational orphan view semantically aligned with reconcile_agi_pipeline().
-- Only executed queue actions without a run are actionable orphans.
-- Rejected/denied historical actions remain evidence and must not be flagged as orphaned.

create or replace view public.v_queue_without_run as
select
  q.id as queue_id,
  q.project_id,
  q.agi_id,
  q.action_type,
  q.risk_level,
  q.status,
  q.created_at
from public.agi_action_queue q
left join public.agi_runs r on r.action_id = q.id
left join public.agi_action_queue_orphan_archive a on a.queue_id = q.id
where q.status = 'executed'
  and r.id is null
  and a.queue_id is null;

-- Preserve the existing server-only boundary for this operational view.
revoke all privileges on table public.v_queue_without_run from anon, authenticated;
