begin;

-- Harden exposed evaluation-adjacent/public RPCs against search_path hijacking.
-- Own-history functions already have authenticated-user RLS predicates, so they
-- can safely run as the invoker and therefore cannot bypass those row policies.

alter function public.get_my_crash_history(integer)
  security invoker
  set search_path = '';

alter function public.get_my_slot_history(integer)
  security invoker
  set search_path = '';

alter function public.get_public_leaderboard(integer, integer)
  set search_path = '';

alter function public.get_public_recent_wins(integer)
  set search_path = '';

-- Replace implicit PUBLIC EXECUTE with explicit role grants so the intended
-- API roles remain stable while unrelated roles do not inherit execution.
revoke execute on function public.get_my_crash_history(integer) from public;
revoke execute on function public.get_my_slot_history(integer) from public;
revoke execute on function public.get_public_leaderboard(integer, integer) from public;
revoke execute on function public.get_public_recent_wins(integer) from public;

grant execute on function public.get_my_crash_history(integer) to authenticated, service_role;
grant execute on function public.get_my_slot_history(integer) to authenticated, service_role;
grant execute on function public.get_public_leaderboard(integer, integer) to anon, authenticated, service_role;
grant execute on function public.get_public_recent_wins(integer) to anon, authenticated, service_role;

commit;
