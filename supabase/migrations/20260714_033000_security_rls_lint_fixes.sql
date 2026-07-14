-- =====================================================================
-- Hocker AGI Technologies — Supabase Security & RLS Migration
-- Project: yvuibbcuntqpyqiuqggd
-- Date:   2026-07-14
-- Purpose: Fix lint issues — RLS no-policy tables, SECURITY DEFINER
--          EXECUTE exposure, mutable search_path, duplicate policies.
--
-- SAFETY: All changes are additive/RESTRICTIVE. No data is modified.
--         service_role bypasses RLS so backend (NOVA, hocker.one API
--         routes using createAdminSupabase) is unaffected. Browser
--         client (anon key) gains scoped read access for logged-in
--         project admins only.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- PART 1: RLS policies for the 18 tables that have RLS enabled but
--         ZERO policies (frontend reads return empty).
--
-- Strategy per table:
--   a) service_role all-access policy (matches existing _service_all
--      pattern used across the rest of the DB; explicit & safe since
--      service_role bypasses RLS by default, but makes the policy set
--      complete so Supabase lints pass).
--   b) For tables WITH a project_id column: an authenticated SELECT
--      policy scoped by is_project_admin(project_id) so logged-in
--      owner/admin/operator users can read their own project's rows
--      through the browser client. No writes from anon/authenticated.
--   c) For tables WITHOUT project_id: service_role only (internal
--      tables — cross-cutting identity/reconciliation/scheduler data
--      accessed via backend service_role).
-- ---------------------------------------------------------------------

-- Helper: these tables have project_id (confirmed via schema inspection)
--   agi_action_queue_orphan_archive  (project_id text)
--   agi_agent_tools                  (project_id text)
--   agi_error_patterns               (project_id text)
--   agi_runs                         (project_id text)
--   agi_tasks                        (project_id text)
--   agi_update_feed                  (project_id text)
--   agi_update_sources               (project_id text)
--   client_brand_context             (project_id text)
--   client_campaign_history          (project_id text)
--   client_comment_insights          (project_id text)
--   client_content_history           (project_id text)
--   client_context_profiles          (project_id text)
--   command_logs                     (NO project_id)
--   memory_archive_manifest          (project_id text)
-- These have NO project_id:
--   agi_identity_aliases             (canonical_agi_id only)
--   agi_reconciliation_events        (no project_id)
--   agi_scheduler_alerts             (no project_id)
--   agi_tools                        (global registry, no project_id)

-- --- Tables WITH project_id: service_all + authenticated admin read ---

CREATE POLICY agi_action_queue_orphan_archive_service_all
  ON public.agi_action_queue_orphan_archive
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_action_queue_orphan_archive_admin_read
  ON public.agi_action_queue_orphan_archive
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_agent_tools_service_all
  ON public.agi_agent_tools
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_agent_tools_admin_read
  ON public.agi_agent_tools
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_error_patterns_service_all
  ON public.agi_error_patterns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_error_patterns_admin_read
  ON public.agi_error_patterns
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_runs_service_all
  ON public.agi_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_runs_admin_read
  ON public.agi_runs
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_tasks_service_all
  ON public.agi_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_tasks_admin_read
  ON public.agi_tasks
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_update_feed_service_all
  ON public.agi_update_feed
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_update_feed_admin_read
  ON public.agi_update_feed
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY agi_update_sources_service_all
  ON public.agi_update_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_update_sources_admin_read
  ON public.agi_update_sources
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY client_brand_context_service_all
  ON public.client_brand_context
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_brand_context_admin_read
  ON public.client_brand_context
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY client_campaign_history_service_all
  ON public.client_campaign_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_campaign_history_admin_read
  ON public.client_campaign_history
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY client_comment_insights_service_all
  ON public.client_comment_insights
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_comment_insights_admin_read
  ON public.client_comment_insights
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY client_content_history_service_all
  ON public.client_content_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_content_history_admin_read
  ON public.client_content_history
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY client_context_profiles_service_all
  ON public.client_context_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY client_context_profiles_admin_read
  ON public.client_context_profiles
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

CREATE POLICY memory_archive_manifest_service_all
  ON public.memory_archive_manifest
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY memory_archive_manifest_admin_read
  ON public.memory_archive_manifest
  FOR SELECT TO authenticated
  USING (is_project_admin(project_id));

-- --- Tables WITHOUT project_id: service_role only (internal) ---

CREATE POLICY agi_identity_aliases_service_all
  ON public.agi_identity_aliases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_reconciliation_events_service_all
  ON public.agi_reconciliation_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY agi_scheduler_alerts_service_all
  ON public.agi_scheduler_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- agi_tools is a global registry (no project_id). service_role only.
CREATE POLICY agi_tools_service_all
  ON public.agi_tools
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- command_logs links to commands via command_id but has no project_id
-- directly. service_role only (backend writes/reads logs).
CREATE POLICY command_logs_service_all
  ON public.command_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- PART 2: Revoke EXECUTE from anon/authenticated on 4 dangerous
--         SECURITY DEFINER functions (admin/scheduler/AGI-runtime
--         functions that should only be callable by the backend
--         service_role, never by anonymous or even regular logged-in
--         users).
--
-- These are NOT auth triggers (handle_new_user* are kept executable).
-- They are internal orchestration functions.
-- ---------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.bootstrap_agi_tasks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_agi_tasks(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_hocker_autonomous_scheduler(integer, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_queued_agi_runs(integer) FROM PUBLIC, anon, authenticated;

-- Ensure service_role & postgres keep EXECUTE (explicit, safe)
GRANT EXECUTE ON FUNCTION public.bootstrap_agi_tasks() TO service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_agi_tasks(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_hocker_autonomous_scheduler(integer, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_queued_agi_runs(integer) TO service_role;

-- ---------------------------------------------------------------------
-- PART 3: Fix mutable search_path on 6 functions by setting an
--         explicit search_path = 'public'. We keep the EXACT original
--         bodies (verified via pg_get_functiondef) and only add the
--         SET search_path clause to pin the resolution path.
--         SECURITY DEFINER is preserved only where already present;
--         we do NOT add SECURITY DEFINER to functions that did not
--         have it (to avoid privilege escalation).
-- ---------------------------------------------------------------------

-- canonical_agi_id — SQL STABLE helper (was NOT security definer)
CREATE OR REPLACE FUNCTION public.canonical_agi_id(p_agi_id text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
  select coalesce(
    (select canonical_agi_id
     from public.agi_identity_aliases
     where alias = p_agi_id),
    p_agi_id
  );
$function$;

-- is_project_member — SQL STABLE helper (was NOT security definer)
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = p_project_id
      and m.user_id = auth.uid()
  );
$function$;

-- set_updated_at — trigger (was NOT security definer)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- sync_nova_thread_id — trigger (was NOT security definer)
CREATE OR REPLACE FUNCTION public.sync_nova_thread_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.thread_id is null then
    new.thread_id := new.id;
  end if;

  return new;
end;
$function$;

-- hocker_audit_logs_block_mutation — trigger (was NOT security definer)
CREATE OR REPLACE FUNCTION public.hocker_audit_logs_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  raise exception
    'audit_logs is append-only (HOCKER tamper-evident chain); % rejected', tg_op
    using errcode = 'check_violation';
end;
$function$;

-- _distribute_affiliate_commission — plpgsql (was NOT security definer)
-- references affiliate_earnings + balances (NOT affiliate_commissions)
CREATE OR REPLACE FUNCTION public._distribute_affiliate_commission(p_affiliate_user_id uuid, p_referred_user_id uuid, p_wager_amount numeric, p_commission_amount numeric, p_wager_ref text, p_game text)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    -- Insertar el registro de la ganancia en la nueva tabla
    INSERT INTO affiliate_earnings (
        affiliate_user_id,
        referred_user_id,
        wager_amount,
        commission_amount,
        wager_ref,
        game
    ) VALUES (
        p_affiliate_user_id,
        p_referred_user_id,
        p_wager_amount,
        p_commission_amount,
        p_wager_ref,
        p_game
    );

    -- Actualizar el saldo de comisiones del afiliado
    UPDATE balances
    SET commission_balance = commission_balance + p_commission_amount
    WHERE user_id = p_affiliate_user_id;
END;
$function$;

-- ---------------------------------------------------------------------
-- PART 4: Remove DUPLICATE permissive policies.
--         Keep the canonical "*_owner" named policy; drop the "*_own"
--         duplicate. For system_controls, the service_all (service_role
--         scoped) + admin_write (authenticated admin) are NOT actually
--         conflicting (different roles) — but the lint flags 2
--         permissive policies on command '*'. We keep admin_write and
--         drop the redundant service_all (service_role bypasses RLS
--         anyway so the policy is unnecessary).
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS balances_select_own ON public.balances;
DROP POLICY IF EXISTS balances_update_own ON public.balances;
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
DROP POLICY IF EXISTS system_controls_service_all ON public.system_controls;

-- ---------------------------------------------------------------------
-- PART 5: nodes & commands ALREADY have commands_admin_write and
--         nodes_admin_write policies (FOR ALL TO authenticated USING
--         is_project_admin(project_id)). These already grant reads to
--         logged-in project admins. No additional policy needed.
--
--         (Verified via pg_policies — nothing to do here.)
-- ---------------------------------------------------------------------

COMMIT;
