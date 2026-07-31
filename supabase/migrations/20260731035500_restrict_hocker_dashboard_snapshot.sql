-- Restrict the internal Hocker dashboard summary to authorized Hocker ONE members.

begin;

alter table public.hocker_dashboard_snapshot enable row level security;

drop policy if exists hocker_dashboard_snapshot_select_authenticated
  on public.hocker_dashboard_snapshot;
drop policy if exists hocker_dashboard_snapshot_select_authorized
  on public.hocker_dashboard_snapshot;

create policy hocker_dashboard_snapshot_select_authorized
on public.hocker_dashboard_snapshot
for select
to authenticated
using (private.is_project_admin('hocker-one'));

commit;
