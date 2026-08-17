begin;

-- Restore the intended read-only command queue access for operators without
-- widening legacy command writes. The API and RBAC layer grant commands:view
-- to operators, while owner/admin remain the only project roles allowed to
-- create or mutate legacy commands.

create or replace function private.is_project_operator_or_above(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id::text = p_project_id
      and pm.user_id::text = (select auth.uid())::text
      and lower(pm.role) in ('owner', 'admin', 'operator')
  );
$$;

revoke all on function private.is_project_operator_or_above(text) from public;
grant execute on function private.is_project_operator_or_above(text) to authenticated;
grant execute on function private.is_project_operator_or_above(text) to service_role;

drop policy if exists "commands_select_if_member" on public.commands;
drop policy if exists "commands_select_owner_admin_operator" on public.commands;

create policy "commands_select_owner_admin_operator"
on public.commands
for select
to authenticated
using (private.is_project_operator_or_above(project_id));

commit;
