-- HOCKER security hardening: project membership mutations require owner/admin.
--
-- Production evidence showed project_members INSERT/UPDATE/DELETE policies calling
-- private.is_project_admin(project_id), while that helper intentionally includes
-- operator for other operational read/write surfaces. Keep the shared helper intact
-- and narrow only the membership-governance boundary.

begin;

drop policy if exists project_members_insert_admin on public.project_members;
drop policy if exists project_members_update_admin on public.project_members;
drop policy if exists project_members_delete_admin on public.project_members;

create policy project_members_insert_admin
on public.project_members
for insert
to authenticated
with check (private.is_project_owner_or_admin(project_id));

create policy project_members_update_admin
on public.project_members
for update
to authenticated
using (private.is_project_owner_or_admin(project_id))
with check (private.is_project_owner_or_admin(project_id));

create policy project_members_delete_admin
on public.project_members
for delete
to authenticated
using (private.is_project_owner_or_admin(project_id));

commit;
