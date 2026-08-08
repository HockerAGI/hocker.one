begin;

-- HOCKER ONE production-readiness hardening.
-- The legacy `commands` queue is a compatibility surface. Operators may observe
-- permitted state through existing read policies, but only owner/admin identities
-- may create or mutate legacy commands. Service workers retain their dedicated
-- service_role policy.

drop policy if exists "commands_admin_write" on public.commands;
drop policy if exists "commands_owner_admin_write" on public.commands;
drop function if exists private.is_project_owner_or_admin(uuid);

create or replace function private.is_project_owner_or_admin(p_project_id text)
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
      and lower(pm.role) in ('owner', 'admin')
  );
$$;

revoke all on function private.is_project_owner_or_admin(text) from public;
grant execute on function private.is_project_owner_or_admin(text) to authenticated;
grant execute on function private.is_project_owner_or_admin(text) to service_role;

create policy "commands_owner_admin_write"
on public.commands
for all
to authenticated
using (private.is_project_owner_or_admin(project_id))
with check (private.is_project_owner_or_admin(project_id));

commit;
