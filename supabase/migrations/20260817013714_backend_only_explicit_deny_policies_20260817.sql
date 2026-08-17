begin;

-- These relations are backend-only today. They already have RLS enabled and
-- no anon/authenticated table grants. Keep that effective behavior explicit so
-- future grant/policy changes fail closed instead of relying on "no policy" as
-- an implicit security contract.

alter table public.compliance_events enable row level security;
drop policy if exists compliance_events_deny_client_access on public.compliance_events;
create policy compliance_events_deny_client_access
  on public.compliance_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

alter table public.game_history enable row level security;
drop policy if exists game_history_deny_client_access on public.game_history;
create policy game_history_deny_client_access
  on public.game_history
  for all
  to anon, authenticated
  using (false)
  with check (false);

alter table public.wager_progress_ledger enable row level security;
drop policy if exists wager_progress_ledger_deny_client_access on public.wager_progress_ledger;
create policy wager_progress_ledger_deny_client_access
  on public.wager_progress_ledger
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;
