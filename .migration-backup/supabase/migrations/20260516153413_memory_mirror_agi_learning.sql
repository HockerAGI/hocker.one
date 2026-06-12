-- HOCKER ONE — Memory Mirror IA↔IA
-- Sprint 12.6C
-- Objetivo:
-- Crear base real para aprendizaje entre AGIs:
-- AGI -> Syntia -> NOVA -> Vertx/Jurix -> Memory Mirror -> AGIs destino.
--
-- Seguridad:
-- - RLS activado.
-- - Sin políticas públicas de lectura/escritura.
-- - Uso esperado: service_role desde APIs privadas owner/internal.
-- - No almacenar secretos, tokens, contraseñas ni PII sensible.

create table if not exists public.agi_learning_events (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  source_agi_id text not null,
  source_agi_name text,
  source_module text,

  learning_title text not null,
  learning_summary text not null,
  learning_category text not null default 'general',

  evidence jsonb not null default '{}'::jsonb,
  suggested_targets text[] not null default '{}'::text[],

  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),

  status text not null default 'pending_review'
    check (status in (
      'pending_review',
      'approved',
      'rejected',
      'blocked',
      'archived'
    )),

  contains_sensitive_data boolean not null default false,
  sensitive_data_note text,

  submitted_by text not null default 'hocker-one',
  reviewed_by text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_memory_mirror (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  learning_event_id uuid references public.agi_learning_events(id) on delete set null,

  title text not null,
  summary text not null,
  category text not null default 'general',

  source_agi_id text not null,
  source_agi_name text,

  target_agi_ids text[] not null default '{}'::text[],
  target_modules text[] not null default '{}'::text[],

  memory_payload jsonb not null default '{}'::jsonb,

  usefulness_score integer not null default 1
    check (usefulness_score between 1 and 5),

  safety_status text not null default 'safe'
    check (safety_status in ('safe', 'restricted', 'blocked')),

  approved_by_nova boolean not null default false,
  approved_by_syntia boolean not null default false,
  approved_by_vertx boolean not null default false,
  approved_by_jurix boolean not null default false,

  active boolean not null default true,

  created_by text not null default 'hocker-one',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_learning_reviews (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  learning_event_id uuid not null references public.agi_learning_events(id) on delete cascade,
  memory_mirror_id uuid references public.agi_memory_mirror(id) on delete set null,

  reviewer_agi_id text not null,
  reviewer_agi_name text,
  reviewer_role text not null default 'reviewer'
    check (reviewer_role in ('nova', 'syntia', 'vertx', 'jurix', 'owner', 'reviewer')),

  decision text not null
    check (decision in ('approved', 'rejected', 'blocked', 'needs_changes', 'noted')),

  reason text not null,
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),

  policy_notes jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_agi_learning_events_project_created
  on public.agi_learning_events(project_id, created_at desc);

create index if not exists idx_agi_learning_events_status
  on public.agi_learning_events(status);

create index if not exists idx_agi_learning_events_source
  on public.agi_learning_events(source_agi_id);

create index if not exists idx_agi_memory_mirror_project_created
  on public.agi_memory_mirror(project_id, created_at desc);

create index if not exists idx_agi_memory_mirror_active
  on public.agi_memory_mirror(active);

create index if not exists idx_agi_learning_reviews_event
  on public.agi_learning_reviews(learning_event_id, created_at desc);

alter table public.agi_learning_events enable row level security;
alter table public.agi_memory_mirror enable row level security;
alter table public.agi_learning_reviews enable row level security;

-- Sin políticas públicas.
-- Las APIs privadas deberán usar service_role y owner/internal gate.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_agi_learning_events_updated_at on public.agi_learning_events;
create trigger set_agi_learning_events_updated_at
before update on public.agi_learning_events
for each row execute function public.set_updated_at();

drop trigger if exists set_agi_memory_mirror_updated_at on public.agi_memory_mirror;
create trigger set_agi_memory_mirror_updated_at
before update on public.agi_memory_mirror
for each row execute function public.set_updated_at();
