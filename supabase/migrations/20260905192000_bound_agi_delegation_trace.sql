-- HOCKER ONE — bounded AGI-to-AGI delegation lineage
alter table public.agi_tasks
  add column if not exists parent_run_id uuid references public.agi_runs(id) on delete set null,
  add column if not exists delegation_depth integer not null default 0,
  add column if not exists delegation_fanout integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agi_tasks_delegation_depth_ck') then
    alter table public.agi_tasks add constraint agi_tasks_delegation_depth_ck
      check (delegation_depth between 0 and 8);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agi_tasks_delegation_fanout_ck') then
    alter table public.agi_tasks add constraint agi_tasks_delegation_fanout_ck
      check (delegation_fanout between 0 and 8);
  end if;
end $$;

create index if not exists idx_agi_tasks_parent_run
  on public.agi_tasks(project_id, parent_run_id, created_at desc);

create index if not exists idx_agi_tasks_delegation
  on public.agi_tasks(project_id, delegation_depth, delegation_fanout, created_at desc);
