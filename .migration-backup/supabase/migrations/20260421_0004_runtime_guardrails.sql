begin;

create extension if not exists pgcrypto;

-- =========================
-- AUDIT LOGS: lectura admin + inserción admin
-- =========================
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_logs_select_admin'
  ) then
    create policy "audit_logs_select_admin"
    on public.audit_logs
    for select
    to authenticated
    using (
      project_id is null
      or public.is_project_admin(project_id)
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_logs_insert_admin'
  ) then
    create policy "audit_logs_insert_admin"
    on public.audit_logs
    for insert
    to authenticated
    with check (
      project_id is null
      or public.is_project_admin(project_id)
    );
  end if;
end;
$$;

-- =========================
-- EVENTS: update admin opcional para correcciones controladas
-- =========================
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'events_update_admin'
  ) then
    create policy "events_update_admin"
    on public.events
    for update
    to authenticated
    using (public.is_project_admin(project_id))
    with check (public.is_project_admin(project_id));
  end if;
end;
$$;

-- =========================
-- Commands: índice operativo para runner/orchestrator
-- =========================
create index if not exists commands_status_approval_node_created_idx
on public.commands(status, needs_approval, node_id, created_at desc);

commit;