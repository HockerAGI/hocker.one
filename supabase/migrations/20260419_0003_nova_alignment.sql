begin;

create extension if not exists pgcrypto;

alter table if exists public.commands
  alter column node_id drop not null;

alter table if exists public.nova_threads
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists nova_threads_set_updated_at on public.nova_threads;
create trigger nova_threads_set_updated_at
before update on public.nova_threads
for each row execute function public.tg_set_updated_at();

alter table if exists public.nova_messages
  drop constraint if exists nova_messages_role_check;

alter table if exists public.nova_messages
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table if exists public.nova_messages
  add constraint nova_messages_role_check
  check (role in ('system','user','assistant','tool'));

alter table if exists public.llm_usage
  add column if not exists thread_id uuid references public.nova_threads(id) on delete set null;

create index if not exists llm_usage_project_thread_idx
  on public.llm_usage(project_id, thread_id, created_at desc);

commit;