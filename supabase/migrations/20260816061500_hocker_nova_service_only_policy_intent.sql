-- HOCKER ONE / NOVA — make backend-only RLS intent explicit.
-- Staged migration only. Applying to production still follows the normal migration/release gate.
-- This migration does not grant client access; it preserves service-role-only semantics.

do $$
declare
  relation_name text;
  relation_ref regclass;
begin
  foreach relation_name in array array[
    'private.nova_rate_limit_buckets',
    'public.agi_chat_messages',
    'public.agi_integration_checks',
    'public.agi_runtime_tokens',
    'public.context_bridge_capabilities',
    'public.context_bridge_checkpoints',
    'public.context_bridge_coverage',
    'public.context_bridge_manifests',
    'public.context_bridge_sources',
    'public.owner_gate_approvals'
  ]
  loop
    relation_ref := to_regclass(relation_name);
    if relation_ref is not null then
      execute format('drop policy if exists deny_clients_service_only on %s', relation_ref);
      execute format(
        'create policy deny_clients_service_only on %s for all to anon, authenticated using (false) with check (false)',
        relation_ref
      );
    end if;
  end loop;
end;
$$;

create index if not exists context_bridge_manifests_approval_id_idx
  on public.context_bridge_manifests (approval_id)
  where approval_id is not null;

comment on index public.context_bridge_manifests_approval_id_idx is
  'Supports Context Bridge Owner Gate approval lookup without changing authorization semantics.';
