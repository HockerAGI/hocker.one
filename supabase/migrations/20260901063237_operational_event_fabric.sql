begin;

create table if not exists public.hocker_operational_events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  source_table text not null,
  operation text not null,
  record_id text,
  created_at timestamptz not null default now()
);

create index if not exists hocker_operational_events_project_created_idx
  on public.hocker_operational_events (project_id, created_at desc);

alter table public.hocker_operational_events enable row level security;

create policy hocker_operational_events_select_member
on public.hocker_operational_events
for select
to authenticated
using (public.is_project_member(project_id));

revoke all on table public.hocker_operational_events from anon, authenticated;
grant select on table public.hocker_operational_events to authenticated;
grant select, insert, update, delete on table public.hocker_operational_events to service_role;

create or replace function public.emit_hocker_operational_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.hocker_operational_events (project_id, source_table, operation, record_id)
  values (
    coalesce(new.project_id, old.project_id),
    tg_table_name,
    tg_op,
    coalesce(new.id::text, old.id::text)
  );
  return coalesce(new, old);
end;
$$;

create trigger hocker_operational_events_agi_action_queue
  after insert or update or delete on public.agi_action_queue
  for each row execute function public.emit_hocker_operational_event();

create trigger hocker_operational_events_agi_agents
  after insert or update or delete on public.agi_agents
  for each row execute function public.emit_hocker_operational_event();

create trigger hocker_operational_events_agi_runs
  after insert or update or delete on public.agi_runs
  for each row execute function public.emit_hocker_operational_event();

create trigger hocker_operational_events_nodes
  after insert or update or delete on public.nodes
  for each row execute function public.emit_hocker_operational_event();

alter publication supabase_realtime add table public.hocker_operational_events;

commit;
