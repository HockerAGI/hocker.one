import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";

// Full production snapshot from supabase_migrations.schema_migrations.
// Supabase Branching clones Hocker One main, so every remote version must
// have exactly one local migration filename before Branching can reproduce it.
const REMOTE_PRODUCTION_MIGRATIONS = [
  { version: "20260216", name: "0000_core" },
  { version: "20260226", name: "0002_alignment" },
  { version: "20260419", name: "0003_nova_alignment" },
  { version: "20260421", name: "0004_runtime_guardrails" },
  { version: "20260428", name: "0005_hocker_one_project_alignment" },
  { version: "20260502", name: "0003_hocker_core_hardening" },
  { version: "20260506", name: "hocker_tenant_rls_foundation" },
  { version: "20260516153413", name: "memory_mirror_agi_learning" },
  { version: "20260516185823", name: "memory_mirror_update_feed_retention" },
  { version: "20260516203048", name: "memory_mirror_dedup_propagation" },
  { version: "20260518", name: "140722_agi_runtime_core" },
  { version: "20260519", name: "023616_agi_runtime_action_queue" },
  { version: "20260524", name: "091700_agi_action_queue_lock_idempotency" },
  { version: "20260613", name: "120000_memory_mirror_dedup_unique_constraints" },
  { version: "20260715", name: "000000_security_lint_round2" },
  { version: "20260729233340", name: "payment_admin_grants_hardening_20260729" },
  { version: "20260729234038", name: "least_privilege_profiles_grants_cleanup_20260729" },
  { version: "20260730002428", name: "revoke_audit_logs_client_grants_20260729" },
  { version: "20260730002629", name: "revoke_legacy_client_table_grants_20260729" },
  { version: "20260730002659", name: "limit_public_catalog_to_readonly_20260729" },
  { version: "20260730214443", name: "casino_atomic_money_operations_20260730" },
  { version: "20260730214710", name: "least_privilege_and_function_hardening_20260730" },
  { version: "20260730221742", name: "move_admin_helper_to_private_schema_20260730" },
  { version: "20260731002454", name: "full_hardening_schema_foundation_20260730" },
  { version: "20260731002643", name: "atomic_deposit_promo_affiliate_20260730" },
  { version: "20260731002947", name: "atomic_admin_money_flows_20260730" },
  { version: "20260731003804", name: "privacy_safe_public_game_feeds_20260730" },
  { version: "20260731004136", name: "daily_streak_cycle_and_wagering_20260730" },
  { version: "20260731004534", name: "atomic_wager_effects_and_affiliates_20260730" },
  { version: "20260731004831", name: "atomic_game_settlement_with_wager_effects_20260730" },
  { version: "20260731004909", name: "consolidate_rls_policies_20260730" },
  { version: "20260731004951", name: "financial_function_execute_hardening_20260730" },
  { version: "20260731005107", name: "atomic_withdrawal_request_20260730" },
  { version: "20260731023730", name: "restrict_game_history_seed_exposure" },
  { version: "20260731031409", name: "remove_legacy_crash_play_round" },
  { version: "20260731033126", name: "nova_distributed_rate_limit" },
  { version: "20260731033216", name: "restrict_nova_rate_limit_rpc" },
  { version: "20260731034213", name: "restrict_hocker_dashboard_snapshot" },
  { version: "20260731055911", name: "hide_internal_operational_views" },
  { version: "20260731060000", name: "hide_internal_operational_views" },
  { version: "20260731173018", name: "verifiable_agi_workers_v1" },
  { version: "20260731233428", name: "jurix_compliance_events" },
  { version: "20260801000251", name: "enable_nova_rate_limit_rls" },
  { version: "20260801044102", name: "secure_supply_create_order_rpc" },
  { version: "20260801050515", name: "safe_audit_index_cleanup" },
  { version: "20260801051257", name: "secure_set_updated_at_search_path" },
  { version: "20260801052656", name: "harden_shared_trigger_and_agi_registry" },
  { version: "20260801053314", name: "restrict_agi_registry_to_public_catalog" },
  { version: "20260801195511", name: "optimize_rls_and_remove_duplicate_indexes_20260801" },
  { version: "20260802200541", name: "revoke_legacy_bets_client_insert_20260802" },
  { version: "20260803001802", name: "disable_synthetic_agi_completion_and_require_verified_workers" },
  { version: "20260803003021", name: "serverless_agi_runtime_tokens" },
  { version: "20260803003709", name: "atomic_serverless_agi_completion" },
  { version: "20260803004413", name: "start_serverless_agi_execution" },
  { version: "20260803010205", name: "atomic_serverless_nova_chat_persistence" },
  { version: "20260804012300", name: "agi_canon_registry_1" },
  { version: "20260804012354", name: "agi_canon_registry_2" },
  { version: "20260804012436", name: "agi_canon_registry_3" },
  { version: "20260804012518", name: "agi_canon_registry_4" },
  { version: "20260804012554", name: "agi_runtime_normalization" },
  { version: "20260804012644", name: "agi_tool_assignments_1" },
  { version: "20260804012737", name: "agi_tool_assignments_2" },
  { version: "20260804012803", name: "agi_runtime_constraints" },
  { version: "20260804012856", name: "agi_memory_mirror_completion" },
  { version: "20260804012929", name: "agi_canon_validation" },
  { version: "20260804014747", name: "ai_gateway_health_automation" },
  { version: "20260808215301", name: "hocker_one_commands_owner_gate_hardening" },
  { version: "20260808215327", name: "context_bridge_v1" },
  { version: "20260810182408", name: "chido_payment_provider_hardening_20260806" },
  { version: "20260810182511", name: "chido_prelaunch_games_fail_closed_20260810" },
  { version: "20260810184103", name: "chido_game_settlement_fail_closed_20260806" },
  { version: "20260810184116", name: "kyc_status_constraint_20260806" },
  { version: "20260810184134", name: "game_row_constraints_20260806" },
  { version: "20260810184240", name: "compliance_kyc_rate_hardening_20260806" },
  { version: "20260810184321", name: "game_fairness_access_hardening_20260806" },
  { version: "20260810184341", name: "private_game_history_rpc_20260806" },
  { version: "20260810184413", name: "atomic_admin_financial_audit_20260806" },
  { version: "20260810184437", name: "authenticated_login_rate_reset_20260806" },
  { version: "20260810184459", name: "chido_game_control_scope_hardening_20260810" },
  { version: "20260810190312", name: "chido_private_helper_privilege_hardening_20260810" },
  { version: "20260810191558", name: "agi_canon_validation_privilege_hardening_20260810" },
  { version: "20260810192259", name: "owner_gate_approval_evidence_v1" },
  { version: "20260810202047", name: "owner_gate_legacy_activation_retirement" },
  { version: "20260811094745", name: "commands_read_role_alignment_20260811" },
  { version: "20260811100821", name: "promo_offer_public_visibility_hardening_20260811" },
  { version: "20260811213752", name: "context_bridge_owner_aal2_evidence" },
  { version: "20260814024830", name: "hocker_ads_client_context_fail_closed" },
  { version: "20260814102158", name: "agi_internal_backend_only_contract_20260814" },
  { version: "20260814103957", name: "nodes_read_role_alignment_20260814" },
  { version: "20260814104734", name: "nodes_schema_legacy_read_policy_cleanup_20260814" },
  { version: "20260816215532", name: "hocker_nova_service_only_policy_intent" },
  { version: "20260816215830", name: "unified_agi_sessions" },
  { version: "20260816215914", name: "unified_agi_session_explicit_deny_policies" },
  { version: "20260816220010", name: "unified_agi_legacy_quarantine" },
  { version: "20260816220105", name: "link_dedicated_nova_fallback" },
  { version: "20260816220145", name: "unified_agi_sessions_service_role_least_privilege" },
  { version: "20260817003451", name: "core_command_node_policy_reconciliation_20260817" },
  { version: "20260817013714", name: "backend_only_explicit_deny_policies_20260817" },
  { version: "20260817021859", name: "project_members_owner_admin_write_hardening_20260816" },
  { version: "20260817052915", name: "agi_canonical_fk_indexes_20260817" },
  { version: "20260830030000", name: "security_definer_rpc_hardening" },
  { version: "20260830151252", name: "security_definer_rpc_hardening" },
  { version: "20260830153247", name: "revoke_dead_public_agi_catalog_view_grants" },
  { version: "20260901063237", name: "operational_event_fabric" },
  { version: "20260902225257", name: "rollback_operational_event_fabric" },
  { version: "20260903182025", name: "align_queue_orphan_view_with_reconciler" },
  { version: "20260904120000", name: "align_queue_orphan_view_with_reconciler" },
  { version: "20260905192000", name: "bound_agi_delegation_trace" },
  { version: "20260918081119", name: "20260913170000_hocker_operating_loop_work_sessions" },
  { version: "20260923070000", name: "hocker_work_session_performance_hardening" },
];

test("Hocker One migration ledger matches production version/name multiplicity exactly", async () => {
  const names = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  const actual = new Map();
  for (const name of names) {
    const match = name.match(/^(\d+)_([^/]+)\.sql$/);
    if (!match) continue;
    const [, version, migrationName] = match;
    actual.set(version, [...(actual.get(version) ?? []), migrationName].sort());
  }

  const expected = new Map();
  for (const migration of REMOTE_PRODUCTION_MIGRATIONS) {
    expected.set(migration.version, [
      ...(expected.get(migration.version) ?? []),
      migration.name,
    ].sort());
  }

  assert.deepEqual(
    [...actual.entries()].sort(),
    [...expected.entries()].sort(),
    "local Supabase migration ledger must match production version/name multiplicity exactly",
  );
});
