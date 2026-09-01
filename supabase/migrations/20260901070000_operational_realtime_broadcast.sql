-- HOCKER Operational Realtime v1
-- Purpose: push safe operational invalidation events to authenticated project members.
-- This does not replace the canonical OperationalSnapshot; clients still reconcile by fetch.
-- It intentionally excludes financial/sensitive payloads and sends only identifiers + operation metadata.

create or replace function public.hocker_broadcast_operational_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_project_id text;
  target_record_id text;
begin
  target_project_id := coalesce(NEW.project_id, OLD.project_id);
  target_record_id := coalesce(NEW.id::text, OLD.id::text);

  if target_project_id is null then
    return coalesce(NEW, OLD);
  end if;

  perform realtime.send(
    jsonb_build_object(
      'project_id', target_project_id,
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', target_record_id,
      'occurred_at', clock_timestamp()
    ),
    'operational_change',
    'hocker:project:' || target_project_id || ':operations',
    true
  );

  return coalesce(NEW, OLD);
end;
$$;

revoke execute on function public.hocker_broadcast_operational_change() from public, anon, authenticated;
grant execute on function public.hocker_broadcast_operational_change() to service_role;

drop trigger if exists hocker_operational_realtime_action_queue on public.agi_action_queue;
create trigger hocker_operational_realtime_action_queue
after insert or update or delete on public.agi_action_queue
for each row execute function public.hocker_broadcast_operational_change();

drop trigger if exists hocker_operational_realtime_agents on public.agi_agents;
create trigger hocker_operational_realtime_agents
after insert or update or delete on public.agi_agents
for each row execute function public.hocker_broadcast_operational_change();

drop trigger if exists hocker_operational_realtime_runs on public.agi_runs;
create trigger hocker_operational_realtime_runs
after insert or update or delete on public.agi_runs
for each row execute function public.hocker_broadcast_operational_change();

drop trigger if exists hocker_operational_realtime_nodes on public.nodes;
create trigger hocker_operational_realtime_nodes
after insert or update or delete on public.nodes
for each row execute function public.hocker_broadcast_operational_change();

alter table realtime.messages enable row level security;

drop policy if exists hocker_operations_realtime_member_read on realtime.messages;
create policy hocker_operations_realtime_member_read
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() like 'hocker:project:%:operations'
  and public.is_project_member(split_part(realtime.topic(), ':', 3))
);
