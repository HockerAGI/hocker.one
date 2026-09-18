begin;

alter view public.v_agi_canon_completeness
  set (security_invoker = true);

revoke all on public.v_agi_canon_completeness
  from public, anon, authenticated;
grant select on public.v_agi_canon_completeness
  to service_role;

revoke all on function public.validate_hocker_agi_canon()
  from public, anon, authenticated;
grant execute on function public.validate_hocker_agi_canon()
  to service_role;

comment on view public.v_agi_canon_completeness is
  'Internal service-only AGI canon completeness snapshot. SECURITY INVOKER prevents creator-privilege bypass.';
comment on function public.validate_hocker_agi_canon() is
  'Internal service-only AGI canon validator; not exposed to browser/authenticated clients.';

commit;
