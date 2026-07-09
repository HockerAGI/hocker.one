-- =============================================================
-- HOCKER ECOSYSTEM — Supabase Audit, Clean, Improve, Integrate
-- Migration: 20260701_000000
-- 
-- AUDIT FINDINGS FIXED BY THIS MIGRATION:
--   1. MISSING INDEXES on high-traffic casino tables (game_history, bets,
--      crash_bets, slot_spins, transactions, kyc_requests, fraud_events,
--      balances, casino_settings) — dashboard queries do full table scans.
--   2. command_logs: RLS enabled but NO policies — table is locked for
--      everyone including service_role (RLS blocks even service_role
--      unless FORCE RLS is set, but no policy means no access pattern
--      is documented). Add service_role full-access policy.
--   3. AGI chat tables (agi_chat_threads, agi_chat_messages): RLS enabled
--      but no authenticated policies — users cannot read their own chat
--      threads via the client. Add project-member read + own-write.
--   4. AGI runtime tables (agi_tasks, agi_runs, agi_action_queue,
--      agi_feedback, agi_integration_checks): RLS enabled but no
--      authenticated policies. Add project-member read so the Hocker ONE
--      dashboard can display AGI activity to project members.
--   5. Duplicate service_role policies on manual_deposit_requests (3),
--      withdraw_requests (3), profiles (2). Drop duplicates, keep one.
--   6. game_history has "Public Game History" policy (USING true) — this
--      is intentional for provably-fair verification, but add an index
--      for the created_at DESC pattern used by dashboards.
--
-- ALL CHANGES ARE ADDITIVE AND IDEMPOTENT:
--   - CREATE INDEX IF NOT EXISTS
--   - CREATE POLICY guarded by IF NOT EXISTS checks
--   - DROP POLICY IF EXISTS for dedup cleanup
--   - No ALTER TABLE column drops or type changes
--   - No data modifications
-- =============================================================

BEGIN;

-- =============================================================
-- SECTION 1: MISSING INDEXES (Performance)
-- =============================================================

-- game_history: zero indexes in baseline — critical for provably-fair
-- verification lookups and dashboard "latest games" queries.
CREATE INDEX IF NOT EXISTS idx_game_history_created_at
  ON public.game_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_history_game_type
  ON public.game_history(game_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_history_hash
  ON public.game_history(hash)
  WHERE hash IS NOT NULL;

-- bets: has game_id and user_id indexes but missing created_at for
-- chronological dashboard queries.
CREATE INDEX IF NOT EXISTS idx_bets_user_created
  ON public.bets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bets_status_created
  ON public.bets(status, created_at DESC);

-- crash_bets: has user_id+created_at composite but missing status index
-- for admin "pending/active bets" monitoring.
CREATE INDEX IF NOT EXISTS idx_crash_bets_created_at
  ON public.crash_bets(created_at DESC);

-- slot_spins: has user_id+created_at composite but missing created_at
-- standalone for global dashboard queries.
CREATE INDEX IF NOT EXISTS idx_slot_spins_created_at
  ON public.slot_spins(created_at DESC);

-- transactions: has type, ref_id, user_id+created_at indexes but
-- missing a standalone created_at DESC for admin revenue dashboards.
CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status_created
  ON public.transactions(status, created_at DESC);

-- kyc_requests: has user_id+created_at but missing status index for
-- admin "pending KYC" queue queries.
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status
  ON public.kyc_requests(status, created_at DESC);

-- fraud_events: zero indexes — add created_at and status for admin
-- monitoring dashboards.
CREATE INDEX IF NOT EXISTS idx_fraud_events_created_at
  ON public.fraud_events(created_at DESC);

-- (fraud_events may have a status column — guard with DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fraud_events'
      AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_fraud_events_status
      ON public.fraud_events(status, created_at DESC);
  END IF;
END $$;

-- balances: only has updated_at index. Add user_id (covered by PK) but
-- add a composite for "top balances" admin queries.
CREATE INDEX IF NOT EXISTS idx_balances_balance_desc
  ON public.balances(balance DESC);

-- casino_settings: small table but add active/settings key index if
-- columns exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'casino_settings'
      AND column_name = 'key'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_casino_settings_key
      ON public.casino_settings(key);
  END IF;
END $$;

-- nova_messages: has thread_id+project_id indexes but missing
-- created_at for chronological chat rendering.
CREATE INDEX IF NOT EXISTS idx_nova_messages_created_at
  ON public.nova_messages(created_at DESC);

-- agi_action_queue: add an index for admin "pending approvals" view.
CREATE INDEX IF NOT EXISTS idx_agi_action_queue_status_created
  ON public.agi_action_queue(status, created_at DESC);

-- agi_runs: add status index for "active runs" monitoring.
CREATE INDEX IF NOT EXISTS idx_agi_runs_status_created
  ON public.agi_runs(status, created_at DESC);

-- agi_tasks: add status index for task queue monitoring.
CREATE INDEX IF NOT EXISTS idx_agi_tasks_status_created
  ON public.agi_tasks(status, created_at DESC);

-- =============================================================
-- SECTION 2: command_logs — Add service_role policy
-- (Table had RLS enabled but NO policies = locked)
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'command_logs'
  ) THEN
    CREATE POLICY command_logs_service_all
      ON public.command_logs
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Also add admin read for authenticated project admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'command_logs'
      AND policyname = 'command_logs_select_admin'
  ) THEN
    CREATE POLICY command_logs_select_admin
      ON public.command_logs
      FOR SELECT TO authenticated
      USING (
        project_id IS NOT NULL AND public.is_project_admin(project_id)
      );
  END IF;
END $$;

-- =============================================================
-- SECTION 3: AGI Chat Tables — Add project-member policies
-- (agi_chat_threads, agi_chat_messages had RLS but no authenticated
--  policies — users could not read their own chat threads)
-- =============================================================

-- agi_chat_threads: project members can read; thread creator can write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_threads'
      AND policyname = 'agi_chat_threads_member_read'
  ) THEN
    CREATE POLICY agi_chat_threads_member_read
      ON public.agi_chat_threads
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_chat_threads.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_threads'
      AND policyname = 'agi_chat_threads_member_insert'
  ) THEN
    CREATE POLICY agi_chat_threads_member_insert
      ON public.agi_chat_threads
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_chat_threads.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_threads'
      AND policyname = 'agi_chat_threads_service_all'
  ) THEN
    CREATE POLICY agi_chat_threads_service_all
      ON public.agi_chat_threads
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_chat_messages: project members can read messages in their
-- project's threads; service_role has full access.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_messages'
      AND policyname = 'agi_chat_messages_member_read'
  ) THEN
    CREATE POLICY agi_chat_messages_member_read
      ON public.agi_chat_messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_chat_messages.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_messages'
      AND policyname = 'agi_chat_messages_member_insert'
  ) THEN
    CREATE POLICY agi_chat_messages_member_insert
      ON public.agi_chat_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_chat_messages.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_chat_messages'
      AND policyname = 'agi_chat_messages_service_all'
  ) THEN
    CREATE POLICY agi_chat_messages_service_all
      ON public.agi_chat_messages
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 4: AGI Runtime Tables — Add project-member read policies
-- (agi_tasks, agi_runs, agi_action_queue, agi_feedback,
--  agi_integration_checks had RLS but no authenticated policies)
-- =============================================================

-- agi_tasks: project members can read tasks for their project
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_tasks'
      AND policyname = 'agi_tasks_member_read'
  ) THEN
    CREATE POLICY agi_tasks_member_read
      ON public.agi_tasks
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_tasks.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_tasks'
      AND policyname = 'agi_tasks_service_all'
  ) THEN
    CREATE POLICY agi_tasks_service_all
      ON public.agi_tasks
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_runs: project members can read runs for their project
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_runs'
      AND policyname = 'agi_runs_member_read'
  ) THEN
    CREATE POLICY agi_runs_member_read
      ON public.agi_runs
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_runs.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_runs'
      AND policyname = 'agi_runs_service_all'
  ) THEN
    CREATE POLICY agi_runs_service_all
      ON public.agi_runs
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_action_queue: project members can read pending actions;
-- only project admins can approve/reject (write).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_action_queue'
      AND policyname = 'agi_action_queue_member_read'
  ) THEN
    CREATE POLICY agi_action_queue_member_read
      ON public.agi_action_queue
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_action_queue.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_action_queue'
      AND policyname = 'agi_action_queue_admin_write'
  ) THEN
    CREATE POLICY agi_action_queue_admin_write
      ON public.agi_action_queue
      TO authenticated
      USING (public.is_project_admin(project_id))
      WITH CHECK (public.is_project_admin(project_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_action_queue'
      AND policyname = 'agi_action_queue_service_all'
  ) THEN
    CREATE POLICY agi_action_queue_service_all
      ON public.agi_action_queue
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_feedback: project members can read; service_role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_feedback'
      AND policyname = 'agi_feedback_member_read'
  ) THEN
    CREATE POLICY agi_feedback_member_read
      ON public.agi_feedback
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_feedback.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_feedback'
      AND policyname = 'agi_feedback_service_all'
  ) THEN
    CREATE POLICY agi_feedback_service_all
      ON public.agi_feedback
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_integration_checks: project members can read integration status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_integration_checks'
      AND policyname = 'agi_integration_checks_member_read'
  ) THEN
    CREATE POLICY agi_integration_checks_member_read
      ON public.agi_integration_checks
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_integration_checks.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_integration_checks'
      AND policyname = 'agi_integration_checks_service_all'
  ) THEN
    CREATE POLICY agi_integration_checks_service_all
      ON public.agi_integration_checks
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_agent_tools: project members can read their project's agent-tool
-- assignments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_agent_tools'
      AND policyname = 'agi_agent_tools_member_read'
  ) THEN
    CREATE POLICY agi_agent_tools_member_read
      ON public.agi_agent_tools
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = agi_agent_tools.project_id
            AND pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_agent_tools'
      AND policyname = 'agi_agent_tools_service_all'
  ) THEN
    CREATE POLICY agi_agent_tools_service_all
      ON public.agi_agent_tools
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SECTION 5: Duplicate Policy Cleanup
-- (manual_deposit_requests had 3 identical service_role policies;
--  withdraw_requests had 3; profiles had 2)
-- =============================================================

-- Drop duplicate service_role policies on manual_deposit_requests.
-- Keep: manual_deposit_service_all. Drop: mdr_service_all.
DROP POLICY IF EXISTS mdr_service_all ON public.manual_deposit_requests;

-- Drop duplicate service_role policies on withdraw_requests.
-- Keep: withdraw_service_all. Drop: withdraws_service_all, wr_service_all.
DROP POLICY IF EXISTS withdraws_service_all ON public.withdraw_requests;
DROP POLICY IF EXISTS wr_service_all ON public.withdraw_requests;

-- Drop duplicate service_role policy on profiles.
-- Keep: profiles_service_all. Drop: profiles_service_full.
DROP POLICY IF EXISTS profiles_service_full ON public.profiles;

-- =============================================================
-- SECTION 6: agi_agents — Add write policy for project admins
-- (Only had a read policy for project members; admins need to
--  register/update agents)
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_agents'
      AND policyname = 'agi_agents_admin_write'
  ) THEN
    CREATE POLICY agi_agents_admin_write
      ON public.agi_agents
      TO authenticated
      USING (public.is_project_admin(project_id))
      WITH CHECK (public.is_project_admin(project_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_agents'
      AND policyname = 'agi_agents_service_all'
  ) THEN
    CREATE POLICY agi_agents_service_all
      ON public.agi_agents
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- agi_tools: add service_role full-access policy (only had
-- authenticated read).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agi_tools'
      AND policyname = 'agi_tools_service_all'
  ) THEN
    CREATE POLICY agi_tools_service_all
      ON public.agi_tools
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- =============================================================
-- POST-MIGRATION NOTES:
--   - All changes are idempotent (safe to re-run).
--   - No data is modified or deleted.
--   - No columns are dropped or type-changed.
--   - Duplicate policies are cleaned up (3→1 on some tables).
--   - 18 new indexes added for dashboard/performance optimization.
--   - 24 new RLS policies added for previously-locked tables.
--   - Memory mirror tables (agi_learning_events, agi_memory_mirror,
--     agi_learning_reviews, agi_update_*, agi_error_patterns,
--     client_*) intentionally remain service_role-only — these
--     contain sensitive inter-AGI learning data and should NOT be
--     directly accessible from the client.
-- =============================================================
