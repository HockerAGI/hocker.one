begin;

revoke all on function public.activate_context_bridge_manifest(uuid, text)
  from public, anon, authenticated, service_role;
drop function public.activate_context_bridge_manifest(uuid, text);

comment on table public.owner_gate_approvals is
  'Append-only approval evidence for Owner Gate actions. Stores hashes and metadata only; never credential values.';

commit;
