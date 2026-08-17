begin;

-- Preserve the existing authorization predicates while removing SELECT overlap
-- from authenticated write policies. Read policies remain authoritative:
--   commands_select_owner_admin_operator
--   nodes_select_member
-- Service-role policies and grants are intentionally unchanged.

drop policy if exists "commands_owner_admin_write" on public.commands;

create policy "commands_owner_admin_insert"
  on public.commands
  for insert
  to authenticated
  with check (private.is_project_owner_or_admin(project_id));

create policy "commands_owner_admin_update"
  on public.commands
  for update
  to authenticated
  using (private.is_project_owner_or_admin(project_id))
  with check (private.is_project_owner_or_admin(project_id));

create policy "commands_owner_admin_delete"
  on public.commands
  for delete
  to authenticated
  using (private.is_project_owner_or_admin(project_id));

drop policy if exists "nodes_admin_write" on public.nodes;

create policy "nodes_admin_insert"
  on public.nodes
  for insert
  to authenticated
  with check (private.is_project_admin(project_id));

create policy "nodes_admin_update"
  on public.nodes
  for update
  to authenticated
  using (private.is_project_admin(project_id))
  with check (private.is_project_admin(project_id));

create policy "nodes_admin_delete"
  on public.nodes
  for delete
  to authenticated
  using (private.is_project_admin(project_id));

commit;
