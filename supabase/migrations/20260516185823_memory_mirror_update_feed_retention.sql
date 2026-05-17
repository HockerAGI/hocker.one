-- HOCKER ONE — Memory Mirror Update Feed + Deduplicación + Retención
-- Sprint 12.6C.2
-- Objetivo:
-- Extender Memory Mirror para feeds especializados por AGI, fuentes oficiales/internas,
-- prevención de errores, deduplicación, vigencia, contexto de cliente y retención hot/warm/cold.

alter table public.agi_learning_events
  add column if not exists update_type text not null default 'agi_observation'
    check (update_type in (
      'policy_update',
      'metric_learning',
      'creative_trend',
      'algorithm_change',
      'error_prevention',
      'platform_rule',
      'internal_result',
      'client_context',
      'agi_observation'
    )),
  add column if not exists source_type text not null default 'agi_observation'
    check (source_type in (
      'official_source',
      'internal_metric',
      'campaign_result',
      'owner_note',
      'agi_observation',
      'client_history',
      'platform_event'
    )),
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_platform text,
  add column if not exists source_hash text,
  add column if not exists semantic_hash text,
  add column if not exists canonical_memory_key text,
  add column if not exists applies_to_agi_ids text[] not null default '{}'::text[],
  add column if not exists applies_to_modules text[] not null default '{}'::text[],
  add column if not exists client_id text,
  add column if not exists brand_id text,
  add column if not exists campaign_id text,
  add column if not exists content_id text,
  add column if not exists profile_id text,
  add column if not exists confidence_score integer not null default 3
    check (confidence_score between 1 and 5),
  add column if not exists freshness_score integer not null default 3
    check (freshness_score between 1 and 5),
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists prevents_error boolean not null default false,
  add column if not exists error_pattern text,
  add column if not exists recommended_action text,
  add column if not exists action_scope text not null default 'recommendation'
    check (action_scope in ('recommendation', 'draft_change', 'minor_action', 'sensitive_action')),
  add column if not exists requires_owner_approval boolean not null default true,
  add column if not exists official_source boolean not null default false,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists times_seen integer not null default 1,
  add column if not exists retention_tier text not null default 'hot'
    check (retention_tier in ('hot', 'warm', 'cold', 'archive')),
  add column if not exists archived_at timestamptz,
  add column if not exists archive_uri text;

alter table public.agi_memory_mirror
  add column if not exists source_hash text,
  add column if not exists semantic_hash text,
  add column if not exists canonical_memory_key text,
  add column if not exists supersedes_memory_id uuid references public.agi_memory_mirror(id) on delete set null,
  add column if not exists memory_version integer not null default 1,
  add column if not exists source_type text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_platform text,
  add column if not exists client_id text,
  add column if not exists brand_id text,
  add column if not exists campaign_id text,
  add column if not exists content_id text,
  add column if not exists profile_id text,
  add column if not exists confidence_score integer not null default 3
    check (confidence_score between 1 and 5),
  add column if not exists freshness_score integer not null default 3
    check (freshness_score between 1 and 5),
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists prevents_error boolean not null default false,
  add column if not exists error_pattern text,
  add column if not exists recommended_action text,
  add column if not exists requires_owner_approval boolean not null default true,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists times_seen integer not null default 1,
  add column if not exists retention_tier text not null default 'hot'
    check (retention_tier in ('hot', 'warm', 'cold', 'archive')),
  add column if not exists archived_at timestamptz,
  add column if not exists archive_uri text;

create table if not exists public.agi_update_sources (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  source_name text not null,
  source_type text not null
    check (source_type in (
      'official_source',
      'internal_metric',
      'campaign_result',
      'owner_note',
      'agi_observation',
      'client_history',
      'platform_event'
    )),

  source_platform text,
  source_url text,
  official_source boolean not null default false,

  applies_to_agi_ids text[] not null default '{}'::text[],
  applies_to_modules text[] not null default '{}'::text[],

  polling_mode text not null default 'manual'
    check (polling_mode in ('manual', 'scheduled', 'event_based', 'api_webhook')),

  trust_level text not null default 'medium'
    check (trust_level in ('low', 'medium', 'high', 'official')),

  active boolean not null default true,

  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_update_feed (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  agi_id text not null,
  source_id uuid references public.agi_update_sources(id) on delete set null,
  learning_event_id uuid references public.agi_learning_events(id) on delete set null,
  memory_mirror_id uuid references public.agi_memory_mirror(id) on delete set null,

  title text not null,
  summary text not null,

  update_type text not null default 'agi_observation'
    check (update_type in (
      'policy_update',
      'metric_learning',
      'creative_trend',
      'algorithm_change',
      'error_prevention',
      'platform_rule',
      'internal_result',
      'client_context',
      'agi_observation'
    )),

  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),

  status text not null default 'active'
    check (status in ('active', 'review_required', 'blocked', 'expired', 'archived')),

  client_id text,
  brand_id text,
  campaign_id text,
  content_id text,
  profile_id text,

  source_hash text,
  semantic_hash text,
  canonical_memory_key text,

  valid_from timestamptz not null default now(),
  expires_at timestamptz,

  confidence_score integer not null default 3
    check (confidence_score between 1 and 5),

  freshness_score integer not null default 3
    check (freshness_score between 1 and 5),

  prevents_error boolean not null default false,
  error_pattern text,
  recommended_action text,

  requires_owner_approval boolean not null default true,

  retention_tier text not null default 'hot'
    check (retention_tier in ('hot', 'warm', 'cold', 'archive')),

  seen_by_agi boolean not null default false,
  applied_by_agi boolean not null default false,
  applied_at timestamptz,
  result_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agi_error_patterns (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  error_hash text not null,
  canonical_memory_key text,

  agi_id text,
  applies_to_agi_ids text[] not null default '{}'::text[],

  client_id text,
  brand_id text,
  campaign_id text,
  content_id text,
  profile_id text,

  platform text,
  error_title text not null,
  error_pattern text not null,
  root_cause text,
  prevention_rule text not null,

  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),

  status text not null default 'active'
    check (status in ('active', 'resolved', 'blocked', 'archived')),

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  times_seen integer not null default 1,

  resolved_by text,
  resolved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(project_id, error_hash)
);

create table if not exists public.client_context_profiles (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',
  client_id text not null,

  client_name text,
  industry text,
  country text,
  language text,
  risk_profile text not null default 'standard'
    check (risk_profile in ('low', 'standard', 'sensitive', 'restricted')),

  context_summary text,
  known_goals jsonb not null default '{}'::jsonb,
  restrictions jsonb not null default '{}'::jsonb,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(project_id, client_id)
);

create table if not exists public.client_brand_context (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',
  client_id text not null,
  brand_id text not null,

  brand_name text,
  voice_tone text,
  visual_style text,
  allowed_claims text[] not null default '{}'::text[],
  blocked_claims text[] not null default '{}'::text[],
  color_notes text,
  format_notes text,

  brand_payload jsonb not null default '{}'::jsonb,

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(project_id, client_id, brand_id)
);

create table if not exists public.client_content_history (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',
  client_id text,
  brand_id text,
  content_id text not null,

  platform text,
  content_type text,
  title text,
  summary text,
  post_url text,
  published_at timestamptz,

  performance_payload jsonb not null default '{}'::jsonb,
  sentiment_payload jsonb not null default '{}'::jsonb,

  source_hash text,
  semantic_hash text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(project_id, content_id)
);

create table if not exists public.client_campaign_history (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',
  client_id text,
  brand_id text,
  campaign_id text not null,

  platform text,
  campaign_name text,
  objective text,
  status text,

  metrics_payload jsonb not null default '{}'::jsonb,
  learning_summary text,

  source_hash text,
  semantic_hash text,

  started_at timestamptz,
  ended_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(project_id, campaign_id)
);

create table if not exists public.client_comment_insights (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',
  client_id text,
  brand_id text,
  content_id text,
  profile_id text,

  platform text,
  insight_summary text not null,
  sentiment text
    check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),

  themes text[] not null default '{}'::text[],
  risk_flags text[] not null default '{}'::text[],

  source_hash text,
  semantic_hash text,

  created_at timestamptz not null default now()
);

create table if not exists public.memory_archive_manifest (
  id uuid primary key default gen_random_uuid(),

  project_id text not null default 'hocker-one',

  archive_uri text not null,
  archive_type text not null default 'json'
    check (archive_type in ('json', 'parquet', 'csv', 'txt', 'other')),

  source_table text not null,
  source_ids uuid[] not null default '{}'::uuid[],

  retention_reason text not null,
  archived_by text not null default 'hocker-one',

  created_at timestamptz not null default now()
);

create index if not exists idx_agi_learning_events_canonical_key
  on public.agi_learning_events(project_id, canonical_memory_key);

create index if not exists idx_agi_learning_events_source_hash
  on public.agi_learning_events(project_id, source_hash);

create index if not exists idx_agi_memory_mirror_canonical_key
  on public.agi_memory_mirror(project_id, canonical_memory_key);

create index if not exists idx_agi_memory_mirror_source_hash
  on public.agi_memory_mirror(project_id, source_hash);

create index if not exists idx_agi_update_feed_agi_status
  on public.agi_update_feed(project_id, agi_id, status, created_at desc);

create index if not exists idx_agi_update_feed_canonical_key
  on public.agi_update_feed(project_id, canonical_memory_key);

create index if not exists idx_agi_error_patterns_hash
  on public.agi_error_patterns(project_id, error_hash);

create index if not exists idx_client_context_profiles_client
  on public.client_context_profiles(project_id, client_id);

create index if not exists idx_client_content_history_client
  on public.client_content_history(project_id, client_id, created_at desc);

create index if not exists idx_client_campaign_history_client
  on public.client_campaign_history(project_id, client_id, created_at desc);

alter table public.agi_update_sources enable row level security;
alter table public.agi_update_feed enable row level security;
alter table public.agi_error_patterns enable row level security;
alter table public.client_context_profiles enable row level security;
alter table public.client_brand_context enable row level security;
alter table public.client_content_history enable row level security;
alter table public.client_campaign_history enable row level security;
alter table public.client_comment_insights enable row level security;
alter table public.memory_archive_manifest enable row level security;

drop trigger if exists set_agi_update_sources_updated_at on public.agi_update_sources;
create trigger set_agi_update_sources_updated_at
before update on public.agi_update_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_agi_update_feed_updated_at on public.agi_update_feed;
create trigger set_agi_update_feed_updated_at
before update on public.agi_update_feed
for each row execute function public.set_updated_at();

drop trigger if exists set_agi_error_patterns_updated_at on public.agi_error_patterns;
create trigger set_agi_error_patterns_updated_at
before update on public.agi_error_patterns
for each row execute function public.set_updated_at();

drop trigger if exists set_client_context_profiles_updated_at on public.client_context_profiles;
create trigger set_client_context_profiles_updated_at
before update on public.client_context_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_client_brand_context_updated_at on public.client_brand_context;
create trigger set_client_brand_context_updated_at
before update on public.client_brand_context
for each row execute function public.set_updated_at();

drop trigger if exists set_client_content_history_updated_at on public.client_content_history;
create trigger set_client_content_history_updated_at
before update on public.client_content_history
for each row execute function public.set_updated_at();

drop trigger if exists set_client_campaign_history_updated_at on public.client_campaign_history;
create trigger set_client_campaign_history_updated_at
before update on public.client_campaign_history
for each row execute function public.set_updated_at();

-- Sin políticas públicas.
-- Acceso esperado: APIs privadas con service_role + owner/internal gate.
