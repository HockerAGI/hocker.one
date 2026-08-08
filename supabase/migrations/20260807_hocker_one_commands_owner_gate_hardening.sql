begin;

-- HOCKER ONE production-readiness hardening.
-- The legacy `commands` queue is a compatibility surface. Operators may observe
-- permitted state through existing read policies, but only owner/admin identities
-- may create or mutate legacy commands. Service workers retain their dedicated
-- service_role policy.

create or replace function private.is_project_owner_or_admin(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and lower(pm.role) in ('owner', 'admin')
  );
$$;

revoke all on function private.is_project_owner_or_admin(uuid) from public;
grant execute on function private.is_project_owner_or_admin(uuid) to authenticated;
grant execute on function private.is_project_owner_or_admin(uuid) to service_role;

drop policy if exists "commands_admin_write" on public.commands;
drop policy if exists "commands_owner_admin_write" on public.commands;

create policy "commands_owner_admin_write"
on public.commands
for all
to authenticated
using (private.is_project_owner_or_admin(project_id))
with check (private.is_project_owner_or_admin(project_id));

commit;
