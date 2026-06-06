alter table if exists public.agi_action_queue
  add column if not exists trace_id text,
  add column if not exists request_id text,
  add column if not exists execution_state text,
  add column if not exists dead_letter_reason text,
  add column if not exists dead_letter_at timestamptz,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists locked_at timestamptz,
  add column if not exists lock_owner text,
  add column if not exists attempt_count integer default 0,
  add column if not exists max_attempts integer default 3,
  add column if not exists last_error text;

create unique index if not exists agi_action_queue_project_id_idempotency_key_idx
  on public.agi_action_queue (project_id, idempotency_key)
  where idempotency_key is not null;
