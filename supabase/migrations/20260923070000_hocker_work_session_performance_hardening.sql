begin;

-- Performance Advisor remediation only. No business behavior or grants change.
create index if not exists agi_tasks_parent_run_id_idx
  on public.agi_tasks(parent_run_id);

create index if not exists hocker_work_session_events_actor_user_id_idx
  on public.hocker_work_session_events(actor_user_id);

create index if not exists hocker_work_sessions_action_id_idx
  on public.hocker_work_sessions(action_id);

create index if not exists hocker_work_sessions_created_by_idx
  on public.hocker_work_sessions(created_by);

create index if not exists hocker_work_sessions_run_id_idx
  on public.hocker_work_sessions(run_id);

create index if not exists hocker_work_sessions_task_id_idx
  on public.hocker_work_sessions(task_id);

-- Preserve the exact owner semantics while evaluating auth.uid() once per statement.
drop policy if exists "hocker_work_sessions_delete_owner" on public.hocker_work_sessions;

create policy "hocker_work_sessions_delete_owner"
  on public.hocker_work_sessions for delete to authenticated
  using (
    exists (
      select 1
      from public.project_members pm
      where pm.project_id = public.hocker_work_sessions.project_id
        and pm.user_id = (select auth.uid())
        and lower(pm.role) = 'owner'
    )
  );

commit;
