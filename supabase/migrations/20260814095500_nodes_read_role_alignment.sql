-- Align browser node visibility with the Hocker One nodes:view contract.
-- Read is permitted to any authenticated member of the project.
-- Existing nodes_admin_write and nodes_service_all policies remain unchanged,
-- so this migration does not widen INSERT/UPDATE/DELETE privileges.

begin;

drop policy if exists "nodes_select_project_member" on public.nodes;

create policy "nodes_select_project_member"
  on public.nodes
  for select
  to authenticated
  using (public.is_project_member(project_id));

commit;
