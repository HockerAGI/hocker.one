begin;
revoke select on table public.agis_public_catalog from anon;
revoke select on table public.agis_public_catalog from authenticated;
commit;