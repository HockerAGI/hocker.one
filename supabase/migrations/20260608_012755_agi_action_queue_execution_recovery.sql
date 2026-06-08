-- 13-2N: execution recovery + terminal dead-letter metadata
ALTER TABLE IF EXISTS public.agi_action_queue
  ADD COLUMN IF NOT EXISTS execution_state text,
  ADD COLUMN IF NOT EXISTS failure_kind text,
  ADD COLUMN IF NOT EXISTS retry_after_at timestamptz,
  ADD COLUMN IF NOT EXISTS dead_letter_reason text,
  ADD COLUMN IF NOT EXISTS dead_letter_at timestamptz;

CREATE INDEX IF NOT EXISTS agi_action_queue_retry_after_idx
  ON public.agi_action_queue (project_id, status, retry_after_at DESC);

CREATE INDEX IF NOT EXISTS agi_action_queue_dead_letter_idx
  ON public.agi_action_queue (project_id, dead_letter_at DESC);
