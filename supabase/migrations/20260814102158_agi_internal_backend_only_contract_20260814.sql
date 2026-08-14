-- Explicit backend-only privilege contract for internal AGI / Context Bridge / Owner Gate state.
-- These tables intentionally keep RLS enabled with no client policies. That fail-closed
-- posture remains visible in Supabase Advisor; no no-op deny policies are added.
-- This migration only reasserts object grants and does not change rows or application logic.

begin;

revoke all privileges on table public.agi_chat_messages from public, anon, authenticated;
grant all privileges on table public.agi_chat_messages to service_role;

revoke all privileges on table public.agi_integration_checks from public, anon, authenticated;
grant all privileges on table public.agi_integration_checks to service_role;

revoke all privileges on table public.agi_runtime_tokens from public, anon, authenticated;
grant all privileges on table public.agi_runtime_tokens to service_role;

revoke all privileges on table public.compliance_events from public, anon, authenticated;
grant all privileges on table public.compliance_events to service_role;

revoke all privileges on table public.context_bridge_capabilities from public, anon, authenticated;
grant all privileges on table public.context_bridge_capabilities to service_role;

revoke all privileges on table public.context_bridge_checkpoints from public, anon, authenticated;
grant all privileges on table public.context_bridge_checkpoints to service_role;

revoke all privileges on table public.context_bridge_coverage from public, anon, authenticated;
grant all privileges on table public.context_bridge_coverage to service_role;

revoke all privileges on table public.context_bridge_manifests from public, anon, authenticated;
grant all privileges on table public.context_bridge_manifests to service_role;

revoke all privileges on table public.context_bridge_sources from public, anon, authenticated;
grant all privileges on table public.context_bridge_sources to service_role;

revoke all privileges on table public.owner_gate_approvals from public, anon, authenticated;
grant all privileges on table public.owner_gate_approvals to service_role;

commit;
