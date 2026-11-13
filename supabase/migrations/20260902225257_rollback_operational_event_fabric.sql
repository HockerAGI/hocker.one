drop trigger if exists hocker_operational_event_action_queue on public.agi_action_queue;
drop trigger if exists hocker_operational_event_agents on public.agi_agents;
drop trigger if exists hocker_operational_event_runs on public.agi_runs;
drop trigger if exists hocker_operational_event_nodes on public.nodes;
drop function if exists public.hocker_record_operational_event();
drop table if exists public.hocker_operational_events cascade;