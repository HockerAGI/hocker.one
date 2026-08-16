-- Explicit fail-closed policies for provider-independent AGI session/message storage.
-- Direct client grants are already revoked. These policies make the deny-by-default
-- intent visible to security tooling while service_role remains server-side only.

drop policy if exists agi_sessions_deny_direct_access on public.agi_sessions;
create policy agi_sessions_deny_direct_access
  on public.agi_sessions
  for all
  to public
  using (false)
  with check (false);

drop policy if exists agi_messages_deny_direct_access on public.agi_messages;
create policy agi_messages_deny_direct_access
  on public.agi_messages
  for all
  to public
  using (false)
  with check (false);

comment on policy agi_sessions_deny_direct_access on public.agi_sessions is
  'Fail-closed direct access. Backend service_role/RPC paths remain server-side only.';
comment on policy agi_messages_deny_direct_access on public.agi_messages is
  'Fail-closed direct access. Backend service_role/RPC paths remain server-side only.';
