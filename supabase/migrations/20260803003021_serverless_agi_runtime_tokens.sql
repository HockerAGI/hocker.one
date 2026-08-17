create table if not exists public.agi_runtime_tokens (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  token_hash text not null unique,
  purpose text not null,
  one_time boolean not null default true,
  active boolean not null default true,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  constraint agi_runtime_tokens_hash_format check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint agi_runtime_tokens_future_expiry check (expires_at > created_at)
);

alter table public.agi_runtime_tokens enable row level security;

revoke all on table public.agi_runtime_tokens from public, anon, authenticated;
grant all on table public.agi_runtime_tokens to service_role;

create index if not exists agi_runtime_tokens_lookup_idx
  on public.agi_runtime_tokens (project_id, token_hash, active, expires_at);

comment on table public.agi_runtime_tokens is
  'Server-only hashed credentials for invoking the Hocker ONE serverless AGI worker. Raw tokens are never stored.';
