# Supabase Baseline Gap Analysis - Hocker ONE

Date: 2026-05-09T11:49:51.742105
Snapshot: `supabase/baseline-audit/20260509_112357_remote_public_schema.sql`

## Executive conclusion

This is an offline comparison between the remote production schema snapshot and local migration intent.

No database mutation was executed.

## Counts

- Remote tables: 50
- Local migration tables detected: 13
- Remote functions: 35
- Local migration functions detected: 6
- Remote policies detected: 117
- Local migration policies detected: 8

## Remote-only tables

- `affiliate_clicks`
- `affiliate_commissions`
- `affiliate_profiles`
- `affiliate_referrals`
- `affiliates`
- `agent_logs`
- `audit_chain`
- `audit_exports`
- `balances`
- `bets`
- `cashback_events`
- `cashback_tiers`
- `casino_settings`
- `command_logs`
- `crash_bets`
- `deposit_intents`
- `fraud_events`
- `free_round_entitlements`
- `free_round_tiers`
- `game_history`
- `hocker_agent_logs`
- `hocker_dashboard_snapshot`
- `kyc_requests`
- `llm_usage`
- `manual_deposit_requests`
- `node_heartbeats`
- `observability_alerts`
- `observability_incidents`
- `promo_claims`
- `promo_offers`
- `slot_spins`
- `supply_order_items`
- `supply_orders`
- `supply_products`
- `transactions`
- `transactions_audit`
- `withdraw_requests`

## Local-only tables

- None

## Remote-only functions

- `_distribute_affiliate_commission`
- `admin_confirm_manual_deposit`
- `admin_reject_manual_deposit`
- `apply_cashback_on_loss`
- `apply_wager_progress`
- `approve_withdraw_request`
- `audit_transaction_trigger`
- `confirm_deposit`
- `crash_play_round`
- `deposit_intents_normalize_ids`
- `gen_chd_folio`
- `gen_ref_code`
- `generate_folio`
- `get_cashback_rate`
- `grant_free_rounds_on_deposit`
- `handle_new_user_balance`
- `handle_new_user_chido`
- `handle_new_user_profile`
- `increment_balance`
- `mark_deposit_and_rewards`
- `pick_transaction_method`
- `pick_transaction_type`
- `place_bet`
- `profiles_add_free_spins`
- `request_withdrawal`
- `secure_insert_transaction`
- `set_updated_at`
- `sync_nova_thread_id`
- `transactions_insert_audit_trigger`
- `update_updated_at`
- `wallet_apply_delta`

## Local-only functions

- `is_project_operator`
- `supply_create_order`

## Remote-only policies

- `affiliate_clicks.affiliate_clicks_select_own`
- `affiliate_clicks.affiliate_clicks_service_all`
- `affiliate_commissions.affiliate_commissions_select_own`
- `affiliate_commissions.affiliate_commissions_service_all`
- `affiliate_profiles.affiliate_profiles_select_own`
- `affiliate_profiles.affiliate_profiles_service_all`
- `affiliate_referrals.affiliate_referrals_select_own`
- `affiliate_referrals.affiliate_referrals_service_all`
- `affiliates.affiliates_select_own`
- `affiliates.affiliates_service_all`
- `agent_logs.agent_logs_service_all`
- `agis.agis_insert_authenticated`
- `agis.agis_select_authenticated`
- `agis.agis_service_all`
- `agis.agis_update_authenticated`
- `audit_chain.audit_chain_select_admin`
- `audit_chain.audit_chain_service_all`
- `audit_exports.audit_exports_select_admin`
- `audit_exports.audit_exports_service_all`
- `audit_logs.audit_logs_service_all`
- `balances.balances_select_owner`
- `balances.balances_service_all`
- `balances.balances_update_owner`
- `bets."User Bets"`
- `bets."User Insert Bets"`
- `cashback_events.cashback_events_select_own`
- `cashback_events.cashback_events_service_all`
- `cashback_tiers.cashback_tiers_read_all`
- `cashback_tiers.cashback_tiers_service_all`
- `casino_settings.casino_settings_service_all`
- `commands.commands_admin_write`
- `commands.commands_select_member`
- `commands.commands_service_all`
- `crash_bets.crash_bets_select_own`
- `crash_bets.crash_bets_service_all`
- `deposit_intents.deposit_intents_select_own`
- `deposit_intents.deposit_intents_service_all`
- `events.events_admin_write`
- `events.events_select_member`
- `events.events_service_all`
- `fraud_events.fraud_events_service_all`
- `free_round_entitlements.free_rounds_select_own`
- `free_round_entitlements.free_rounds_service_all`
- `free_round_tiers.free_round_tiers_read_all`
- `free_round_tiers.free_round_tiers_service_all`
- `game_history."Public Game History"`
- `hocker_agent_logs."Agents Full Access"`
- `hocker_dashboard_snapshot.hocker_dashboard_snapshot_select_authenticated`
- `hocker_dashboard_snapshot.hocker_dashboard_snapshot_service_all`
- `kyc_requests.kyc_requests_insert_own`
- `kyc_requests.kyc_requests_select_own`
- `kyc_requests.kyc_requests_service_all`
- `kyc_requests.kyc_requests_update_own_pending`
- `llm_usage.llm_usage_select_admin`
- `llm_usage.llm_usage_service_all`
- `manual_deposit_requests.manual_deposit_insert_own`
- `manual_deposit_requests.manual_deposit_select_own`
- `manual_deposit_requests.manual_deposit_service_all`
- `manual_deposit_requests.mdr_service_all`
- `node_heartbeats.node_heartbeats_select_admin`
- `node_heartbeats.node_heartbeats_service_all`
- `nodes.nodes_admin_write`
- `nodes.nodes_select_member`
- `nodes.nodes_service_all`
- `nova_messages.nova_messages_member_write`
- `nova_messages.nova_messages_select_member`
- `nova_messages.nova_messages_service_all`
- `nova_threads.nova_threads_member_write`
- `nova_threads.nova_threads_select_member`
- `nova_threads.nova_threads_service_all`
- `observability_alerts.observability_alerts_select_admin`
- `observability_alerts.observability_alerts_service_all`
- `observability_incidents.observability_incidents_select_admin`
- `observability_incidents.observability_incidents_service_all`
- `profiles.profiles_insert_own`
- `profiles.profiles_select_owner`
- `profiles.profiles_service_all`
- `profiles.profiles_service_full`
- `profiles.profiles_update_owner`
- `project_members.project_members_admin_write`
- `project_members.project_members_select_member`
- `project_members.project_members_service_all`
- `projects.projects_select_member`
- `projects.projects_service_all`
- `promo_claims.promo_claims_insert_own`
- `promo_claims.promo_claims_select_own`
- `promo_claims.promo_claims_service_all`
- `promo_claims.promo_claims_update_own`
- `promo_offers.promo_offers_select_window`
- `promo_offers.promo_offers_service_all`
- `slot_spins.slot_spins_select_own`
- `slot_spins.slot_spins_service_all`
- `supply_order_items.supply_order_items_service_all`
- `supply_orders.supply_orders_admin_write`
- `supply_orders.supply_orders_select_member`
- `supply_orders.supply_orders_service_all`
- `supply_products.supply_products_admin_write`
- `supply_products.supply_products_select_member`
- `supply_products.supply_products_service_all`
- `system_controls.system_controls_admin_write`
- `system_controls.system_controls_select_admin`
- `system_controls.system_controls_service_all`
- `transactions.block_delete_for_authenticated`
- `transactions.block_insert_for_authenticated`
- `transactions.block_update_for_authenticated`
- `transactions.transactions_select_owner`
- `transactions.transactions_service_all`
- `transactions_audit.service_role_all`
- `transactions_audit.transactions_audit_service_all`
- `withdraw_requests.withdraw_insert_own`
- `withdraw_requests.withdraw_service_all`
- `withdraw_requests.withdraws_select_own`
- `withdraw_requests.withdraws_service_all`
- `withdraw_requests.wr_service_all`

## Local-only policies

- `agis.agis_insert_admin`
- `agis.agis_select_authed`
- `agis.agis_update_admin`
- `audit_logs.audit_logs_insert_admin`
- `events.events_update_admin`

## Decision rule

Do not adopt CLI migration history until table/function/policy parity is reviewed and approved.

Forbidden until approval:

- `supabase db push`
- `supabase migration repair`
- `supabase db reset`
- destructive SQL against remote production