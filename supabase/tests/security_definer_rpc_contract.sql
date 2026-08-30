-- Read-only contract test for the exposed RPC hardening migration.
-- Run against the target Supabase database after migrations are applied.

DO $$
DECLARE
  v_invoker boolean;
  v_search_path text[];
  v_anon boolean;
  v_authenticated boolean;
  v_service boolean;
BEGIN
  SELECT p.prosecdef, p.proconfig,
         has_function_privilege('anon', p.oid, 'EXECUTE'),
         has_function_privilege('authenticated', p.oid, 'EXECUTE'),
         has_function_privilege('service_role', p.oid, 'EXECUTE')
    INTO v_invoker, v_search_path, v_anon, v_authenticated, v_service
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_my_crash_history'
    AND pg_get_function_identity_arguments(p.oid) = 'p_limit integer';

  IF v_invoker THEN
    RAISE EXCEPTION 'get_my_crash_history must be SECURITY INVOKER';
  END IF;
  IF NOT (v_search_path @> ARRAY['search_path=""']::text[]) THEN
    RAISE EXCEPTION 'get_my_crash_history must pin search_path to empty';
  END IF;
  IF v_anon OR NOT v_authenticated OR NOT v_service THEN
    RAISE EXCEPTION 'get_my_crash_history execute grant matrix is invalid';
  END IF;

  SELECT p.prosecdef, p.proconfig,
         has_function_privilege('anon', p.oid, 'EXECUTE'),
         has_function_privilege('authenticated', p.oid, 'EXECUTE'),
         has_function_privilege('service_role', p.oid, 'EXECUTE')
    INTO v_invoker, v_search_path, v_anon, v_authenticated, v_service
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_my_slot_history'
    AND pg_get_function_identity_arguments(p.oid) = 'p_limit integer';

  IF v_invoker THEN
    RAISE EXCEPTION 'get_my_slot_history must be SECURITY INVOKER';
  END IF;
  IF NOT (v_search_path @> ARRAY['search_path=""']::text[]) THEN
    RAISE EXCEPTION 'get_my_slot_history must pin search_path to empty';
  END IF;
  IF v_anon OR NOT v_authenticated OR NOT v_service THEN
    RAISE EXCEPTION 'get_my_slot_history execute grant matrix is invalid';
  END IF;

  FOR v_invoker, v_search_path, v_anon, v_authenticated, v_service IN
    SELECT p.prosecdef, p.proconfig,
           has_function_privilege('anon', p.oid, 'EXECUTE'),
           has_function_privilege('authenticated', p.oid, 'EXECUTE'),
           has_function_privilege('service_role', p.oid, 'EXECUTE')
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND ((p.proname = 'get_public_leaderboard' AND pg_get_function_identity_arguments(p.oid) = 'p_days integer, p_limit integer')
        OR (p.proname = 'get_public_recent_wins' AND pg_get_function_identity_arguments(p.oid) = 'p_limit integer'))
  LOOP
    IF NOT v_invoker THEN
      RAISE EXCEPTION 'public RPC % unexpectedly changed SECURITY DEFINER semantics', 'review-target';
    END IF;
    IF NOT (v_search_path @> ARRAY['search_path=""']::text[]) THEN
      RAISE EXCEPTION 'public RPC search_path was not pinned to empty';
    END IF;
    IF NOT v_anon OR NOT v_authenticated OR NOT v_service THEN
      RAISE EXCEPTION 'public RPC execute grant matrix is invalid';
    END IF;
  END LOOP;
END $$;
