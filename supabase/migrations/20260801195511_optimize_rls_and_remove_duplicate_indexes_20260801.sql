-- Optimize RLS evaluation while preserving existing access semantics.

DROP POLICY IF EXISTS hocker_tenants_owner_service_only ON public.hocker_tenants;
CREATE POLICY hocker_tenants_owner_service_only
  ON public.hocker_tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS hocker_portal_grants_owner_service_only ON public.hocker_portal_grants;
CREATE POLICY hocker_portal_grants_owner_service_only
  ON public.hocker_portal_grants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS agi_agents_project_members_read ON public.agi_agents;
CREATE POLICY agi_agents_project_members_read
  ON public.agi_agents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members AS pm
      WHERE pm.project_id = agi_agents.project_id
        AND pm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS agi_tools_authenticated_read ON public.agi_tools;
CREATE POLICY agi_tools_authenticated_read
  ON public.agi_tools
  FOR SELECT
  TO authenticated
  USING (true);

-- events_admin_write already covers authenticated UPDATE with the same admin predicate.
DROP POLICY IF EXISTS events_update_admin ON public.events;

-- Keep the canonical indexes created by executable migrations and remove exact duplicates.
DROP INDEX IF EXISTS public.agi_runs_project_idx;
DROP INDEX IF EXISTS public.agi_tasks_project_idx;
DROP INDEX IF EXISTS public.audit_logs_project_created_idx;
DROP INDEX IF EXISTS public.nodes_project_status_idx;
DROP INDEX IF EXISTS public.nova_messages_thread_created_idx;