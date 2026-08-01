do $$
begin
  begin execute 'create index if not exists idx_game_history_created_at on public.game_history(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_game_history_game_type on public.game_history(game_type, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_game_history_hash on public.game_history(hash) where hash is not null'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_bets_user_created on public.bets(user_id, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_bets_status_created on public.bets(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_crash_bets_created_at on public.crash_bets(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_slot_spins_created_at on public.slot_spins(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_transactions_created_at on public.transactions(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_transactions_status_created on public.transactions(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_kyc_requests_status on public.kyc_requests(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_fraud_events_created_at on public.fraud_events(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_fraud_events_status on public.fraud_events(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_balances_balance_desc on public.balances(balance desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_casino_settings_key on public.casino_settings(key)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_nova_messages_created_at on public.nova_messages(created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_agi_action_queue_status_created on public.agi_action_queue(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_agi_runs_status_created on public.agi_runs(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
  begin execute 'create index if not exists idx_agi_tasks_status_created on public.agi_tasks(status, created_at desc)'; exception when undefined_table or undefined_column then null; end;
end $$;

drop policy if exists mdr_service_all on public.manual_deposit_requests;
drop policy if exists withdraws_service_all on public.withdraw_requests;
drop policy if exists wr_service_all on public.withdraw_requests;
drop policy if exists profiles_service_full on public.profiles;

comment on table public.command_logs is 'Service-only command execution logs. Legacy schema has no project_id, so no authenticated RLS policy is granted.';
