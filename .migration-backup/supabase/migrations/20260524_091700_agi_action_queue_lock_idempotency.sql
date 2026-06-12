-- HOCKER ONE · 12.7Z-1A
-- Canonical lock/idempotency hardening for agi_action_queue.
-- Safe additive migration: no destructive changes.

begin;

alter table public.agi_action_queue
  add column if not exists rejected_by uuid,
  add column if not exists executed_by uuid,
  add column if not exists approval_note text,
  add column if not exists rejection_note text,
  add column if not exists execution_result jsonb,
  add column if not exists execution_error text,
  add column if not exists rollback_plan jsonb,
  add column if not exists rejected_at timestamptz,
  add column if not exists executed_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists locked_at timestamptz,
  add column if not exists lock_owner text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_error text;

create unique index if not exists agi_action_queue_project_idempotency_key_uidx
  on public.agi_action_queue(project_id, idempotency_key)
  where idempotency_key is not null and btrim(idempotency_key) <> '';

create index if not exists agi_action_queue_lock_idx
  on public.agi_action_queue(project_id, status, locked_at, created_at desc);

create index if not exists agi_action_queue_github_chain_idx
  on public.agi_action_queue(project_id, tool_key, action_type, created_at desc);

alter table public.agi_action_queue enable row level security;

commit;
