-- HOCKER ONE · Audit chain persisted signatures (tamper-evident)
-- ----------------------------------------------------------------------------
-- Makes the audit trail CRYPTOGRAPHICALLY VERIFIABLE by persisting the HMAC
-- chain (seq, prev_hash, row_hash, signature) at write time, instead of
-- recomputing a throw-away "virtual" chain at read time (which could never
-- detect tampering).
--
-- Safe + additive: columns are added IF NOT EXISTS. Pre-existing rows are NOT
-- backfilled (they were never signed) and remain "legacy" (signature IS NULL).
-- The application reports them as legacy/unverifiable, never as failures.
--
-- DEPLOY ORDER: apply this migration on Supabase FIRST, then deploy the
-- matching application code. The code reads/writes these columns and will
-- error explicitly if they are missing.
--
-- DB-LEVEL PROTECTION:
--  * audit_logs becomes APPEND-ONLY (UPDATE/DELETE blocked by trigger, for
--    everyone including the service role).
--  * Foreign keys with "on delete set null" are removed so deleting a project
--    or auth user can never silently mutate (and thus invalidate) a signed
--    audit row. project_id / actor_user_id keep their historical values
--    forever, which is the correct behaviour for an immutable audit log.
-- ----------------------------------------------------------------------------

begin;

-- 1) Persisted chain columns (additive, nullable so legacy rows are allowed).
alter table public.audit_logs
  add column if not exists seq bigint,
  add column if not exists prev_hash text,
  add column if not exists row_hash text,
  add column if not exists signature text;

-- 2) One signed position per project — prevents chain forks under concurrency.
create unique index if not exists audit_logs_project_seq_uidx
  on public.audit_logs(project_id, seq)
  where seq is not null;

-- 3) Fast chain-head lookup (latest signed row per project).
create index if not exists audit_logs_project_seq_desc_idx
  on public.audit_logs(project_id, seq desc)
  where seq is not null;

-- 4) Remove FK cascades so entity deletion cannot mutate signed audit rows.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.audit_logs'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.audit_logs drop constraint %I', r.conname);
  end loop;
end $$;

-- 5) Append-only enforcement: reject UPDATE and DELETE on audit rows.
create or replace function public.hocker_audit_logs_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'audit_logs is append-only (HOCKER tamper-evident chain); % rejected', tg_op
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists audit_logs_block_update on public.audit_logs;
create trigger audit_logs_block_update
  before update on public.audit_logs
  for each row execute function public.hocker_audit_logs_block_mutation();

drop trigger if exists audit_logs_block_delete on public.audit_logs;
create trigger audit_logs_block_delete
  before delete on public.audit_logs
  for each row execute function public.hocker_audit_logs_block_mutation();

commit;
