-- HOCKER Operational Event Fabric v1
-- Realtime invalidation uses a dedicated, minimal event table.
-- It does NOT replace or duplicate OperationalState; it only signals clients to refresh it.
-- Payloads contain no financial data, secrets, prompts, model output or full database rows.

create table if not exists public.hocker_operational_events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  source_table text not null,
  operation text not null,
  record_id text null,
  occurred_at timestamptz not null default clock_timestamp()
);

create index if not exists hocker_operational_events_project_occurred_idx
  on public.hocker_operational_events (project_id, occurred_at desc);

alter table public.hocker_operational_events enable row level security;

drop policy if exists hocker_operational_events_member_read on public.hocker_operational_events;
create policy hocker_operational_events_member_read
on public.hocker_operational_events
for select
to authenticated
using (public.is_project_member(project_id));

revoke all on public.hocker_operational_events from anon;
revoke insert, update, delete on public.hocker_operational_events from anon, authenticated;
grant select on public.hocker_operational_events to authenticated;
grant select, insert, update, delete on public.hocker_operational_events to service_role;

create or replace function public.hocker_record_operational_event()
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

  insert into public.hocker_operational_events (
    project_id,
    source_table,
    operation,
    record_id
  ) values (
    target_project_id,
    TG_TABLE_NAME,
    TG_OP,
    target_record_id
  );

  return coalesce(NEW, OLD);
end;
$$;

revoke execute on function public.hocker_record_operational_event() from public, anon, authenticated;
grant execute on function public.hocker_record_operational_event() to service_role;

drop trigger if exists hocker_operational_event_action_queue on public.agi_action_queue;
create trigger hocker_operational_event_action_queue
after insert or update of status, risk_level, requires_approval or delete on public.agi_action_queue
for each row execute function public.hocker_record_operational_event();

drop trigger if exists hocker_operational_event_agents on public.agi_agents;
create trigger hocker_operational_event_agents
after insert or update of status or delete on public.agi_agents
for each row execute function public.hocker_record_operational_event();

drop trigger if exists hocker_operational_event_runs on public.agi_runs;
create trigger hocker_operational_event_runs
after insert or update of status, started_at, finished_at or delete on public.agi_runs
for each row execute function public.hocker_record_operational_event();

drop trigger if exists hocker_operational_event_nodes on public.nodes;
create trigger hocker_operational_event_nodes
after insert or update of status, last_seen_at or delete on public.nodes
for each row execute function public.hocker_record_operational_event();

alter publication supabase_realtime add table public.hocker_operational_events;
