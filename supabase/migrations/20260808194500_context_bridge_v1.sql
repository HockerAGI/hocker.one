-- HOCKER ONE Context Bridge v1
-- Operational continuity for ChatGPT, Codex and platform adapters.
-- This does not replace Memory Mirror and never stores raw conversations or secrets.

create table if not exists public.context_bridge_sources (
  id text not null,
  project_id text not null default 'hocker-one',
  provider text not null check (provider in ('chatgpt', 'codex', 'github', 'google_drive', 'supabase', 'vercel')),
  source_kind text not null check (source_kind in ('production_state', 'git_code', 'verified_contract', 'approved_canon', 'external_knowledge', 'conversation')),
  access_mode text not null default 'read_only' check (access_mode in ('read_only', 'owner_gated_write', 'unavailable')),
  status text not null default 'configured' check (status in ('verified', 'connected', 'configured', 'partial', 'missing', 'blocked', 'stale')),
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  last_checkpoint_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, id)
);

create table if not exists public.context_bridge_checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'hocker-one',
  source_id text not null,
  external_ref text not null,
  source_revision text not null,
  source_kind text not null check (source_kind in ('production_state', 'git_code', 'verified_contract', 'approved_canon', 'external_knowledge', 'conversation')),
  summary text not null,
  decisions jsonb not null default '[]'::jsonb check (jsonb_typeof(decisions) = 'array'),
  open_items jsonb not null default '[]'::jsonb check (jsonb_typeof(open_items) = 'array'),
  canonical_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(canonical_refs) = 'array'),
  cursor jsonb not null default '{}'::jsonb check (jsonb_typeof(cursor) = 'object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  contains_secrets boolean not null default false check (contains_secrets = false),
  captured_by text not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (project_id, source_id, external_ref, source_revision, content_hash),
  foreign key (project_id, source_id) references public.context_bridge_sources(project_id, id) on update cascade on delete restrict
);

create table if not exists public.context_bridge_manifests (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'hocker-one',
  manifest_version integer not null check (manifest_version > 0),
  scope text not null check (scope in ('global', 'repository', 'project', 'conversation', 'release')),
  title text not null,
  summary text not null,
  state text not null default 'draft' check (state in ('draft', 'active', 'superseded', 'invalid')),
  source_ids text[] not null default '{}'::text[],
  checkpoint_ids uuid[] not null default '{}'::uuid[],
  canonical_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(canonical_refs) = 'array'),
  capability_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(capability_snapshot) = 'array'),
  coverage_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(coverage_snapshot) = 'array'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  previous_manifest_id uuid references public.context_bridge_manifests(id) on delete set null,
  contains_secrets boolean not null default false check (contains_secrets = false),
  owner_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, manifest_version),
  unique (project_id, content_hash),
  check (state <> 'active' or (owner_approved and approved_by is not null and approved_at is not null and contains_secrets = false))
);

create table if not exists public.context_bridge_coverage (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'hocker-one',
  manifest_id uuid not null references public.context_bridge_manifests(id) on delete cascade,
  domain_key text not null,
  expected_refs integer not null default 0 check (expected_refs >= 0),
  verified_refs integer not null default 0 check (verified_refs >= 0 and verified_refs <= expected_refs),
  status text not null check (status in ('complete', 'partial', 'missing', 'stale', 'blocked')),
  missing_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(missing_refs) = 'array'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  contains_secrets boolean not null default false check (contains_secrets = false),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manifest_id, domain_key)
);

create table if not exists public.context_bridge_capabilities (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'hocker-one',
  source_id text not null,
  provider text not null check (provider in ('chatgpt', 'codex', 'github', 'google_drive', 'supabase', 'vercel')),
  capability_key text not null,
  access_mode text not null check (access_mode in ('read_only', 'owner_gated_write', 'unavailable')),
  status text not null check (status in ('verified', 'configured', 'partial', 'missing', 'blocked')),
  mutates_external boolean not null default false,
  owner_gate_required boolean not null default false,
  evidence_ref text,
  contains_secrets boolean not null default false check (contains_secrets = false),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, source_id, capability_key),
  foreign key (project_id, source_id) references public.context_bridge_sources(project_id, id) on update cascade on delete cascade,
  check (not mutates_external or owner_gate_required)
);

create index if not exists context_bridge_checkpoints_source_observed_idx
  on public.context_bridge_checkpoints(project_id, source_id, observed_at desc);
create index if not exists context_bridge_manifests_state_created_idx
  on public.context_bridge_manifests(project_id, state, created_at desc);
create index if not exists context_bridge_manifests_previous_manifest_idx
  on public.context_bridge_manifests(previous_manifest_id);
create unique index if not exists context_bridge_one_active_manifest_per_project_idx
  on public.context_bridge_manifests(project_id) where state = 'active';
create index if not exists context_bridge_capabilities_provider_idx
  on public.context_bridge_capabilities(project_id, provider, status);

alter table public.context_bridge_sources enable row level security;
alter table public.context_bridge_checkpoints enable row level security;
alter table public.context_bridge_manifests enable row level security;
alter table public.context_bridge_coverage enable row level security;
alter table public.context_bridge_capabilities enable row level security;

-- Service-only storage. No public/authenticated policy is created.
revoke all on table public.context_bridge_sources from public, anon, authenticated;
revoke all on table public.context_bridge_checkpoints from public, anon, authenticated;
revoke all on table public.context_bridge_manifests from public, anon, authenticated;
revoke all on table public.context_bridge_coverage from public, anon, authenticated;
revoke all on table public.context_bridge_capabilities from public, anon, authenticated;

grant all on table public.context_bridge_sources to service_role;
grant all on table public.context_bridge_checkpoints to service_role;
grant all on table public.context_bridge_manifests to service_role;
grant all on table public.context_bridge_coverage to service_role;
grant all on table public.context_bridge_capabilities to service_role;

-- Keep this migration portable: do not depend on a helper created by another
-- feature migration or by the current production schema state.
create or replace function public.context_bridge_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.context_bridge_set_updated_at() from public, anon, authenticated;
grant execute on function public.context_bridge_set_updated_at() to service_role;

drop trigger if exists set_context_bridge_sources_updated_at on public.context_bridge_sources;
create trigger set_context_bridge_sources_updated_at
before update on public.context_bridge_sources
for each row execute function public.context_bridge_set_updated_at();

drop trigger if exists set_context_bridge_manifests_updated_at on public.context_bridge_manifests;
create trigger set_context_bridge_manifests_updated_at
before update on public.context_bridge_manifests
for each row execute function public.context_bridge_set_updated_at();

drop trigger if exists set_context_bridge_coverage_updated_at on public.context_bridge_coverage;
create trigger set_context_bridge_coverage_updated_at
before update on public.context_bridge_coverage
for each row execute function public.context_bridge_set_updated_at();

drop trigger if exists set_context_bridge_capabilities_updated_at on public.context_bridge_capabilities;
create trigger set_context_bridge_capabilities_updated_at
before update on public.context_bridge_capabilities
for each row execute function public.context_bridge_set_updated_at();

create or replace function public.record_context_bridge_checkpoint(p_payload jsonb)
returns public.context_bridge_checkpoints
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_project_id text := coalesce(nullif(btrim(p_payload->>'project_id'), ''), 'hocker-one');
  v_source_id text := nullif(btrim(p_payload->>'source_id'), '');
  v_provider text := nullif(btrim(p_payload->>'provider'), '');
  v_observed_at timestamptz := coalesce(nullif(p_payload->>'observed_at', '')::timestamptz, now());
  v_checkpoint public.context_bridge_checkpoints%rowtype;
  v_capability jsonb;
begin
  if v_source_id is null
     or v_provider is null
     or nullif(btrim(p_payload->>'external_ref'), '') is null
     or nullif(btrim(p_payload->>'source_revision'), '') is null
     or nullif(btrim(p_payload->>'summary'), '') is null
     or nullif(btrim(p_payload->>'captured_by'), '') is null then
    raise exception 'CONTEXT_CHECKPOINT_REQUIRED_FIELDS_MISSING';
  end if;
  if coalesce((p_payload->>'contains_secrets')::boolean, false) then
    raise exception 'CONTEXT_CHECKPOINT_CONTAINS_SECRETS';
  end if;
  if coalesce(p_payload->>'content_hash', '') !~ '^[a-f0-9]{64}$' then
    raise exception 'CONTEXT_CHECKPOINT_HASH_INVALID';
  end if;

  insert into public.context_bridge_sources (
    id,
    project_id,
    provider,
    source_kind,
    access_mode,
    status,
    last_verified_at,
    last_checkpoint_at
  ) values (
    v_source_id,
    v_project_id,
    v_provider,
    p_payload->>'source_kind',
    coalesce(nullif(p_payload->>'source_access_mode', ''), 'read_only'),
    'connected',
    now(),
    v_observed_at
  )
  on conflict (project_id, id) do update
  set provider = excluded.provider,
      source_kind = excluded.source_kind,
      access_mode = excluded.access_mode,
      status = 'connected',
      last_verified_at = now(),
      last_checkpoint_at = excluded.last_checkpoint_at,
      updated_at = now();

  insert into public.context_bridge_checkpoints (
    project_id,
    source_id,
    external_ref,
    source_revision,
    source_kind,
    summary,
    decisions,
    open_items,
    canonical_refs,
    cursor,
    content_hash,
    contains_secrets,
    captured_by,
    observed_at
  ) values (
    v_project_id,
    v_source_id,
    p_payload->>'external_ref',
    p_payload->>'source_revision',
    p_payload->>'source_kind',
    p_payload->>'summary',
    coalesce(p_payload->'decisions', '[]'::jsonb),
    coalesce(p_payload->'open_items', '[]'::jsonb),
    coalesce(p_payload->'canonical_refs', '[]'::jsonb),
    coalesce(p_payload->'cursor', '{}'::jsonb),
    p_payload->>'content_hash',
    false,
    p_payload->>'captured_by',
    v_observed_at
  )
  on conflict (project_id, source_id, external_ref, source_revision, content_hash)
  do update set content_hash = excluded.content_hash
  returning * into v_checkpoint;

  for v_capability in
    select value from jsonb_array_elements(coalesce(p_payload->'capabilities', '[]'::jsonb))
  loop
    insert into public.context_bridge_capabilities (
      project_id,
      source_id,
      provider,
      capability_key,
      access_mode,
      status,
      mutates_external,
      owner_gate_required,
      evidence_ref,
      contains_secrets,
      last_verified_at
    ) values (
      v_project_id,
      v_source_id,
      v_provider,
      v_capability->>'capability_key',
      v_capability->>'access_mode',
      v_capability->>'status',
      coalesce((v_capability->>'mutates_external')::boolean, false),
      coalesce((v_capability->>'owner_gate_required')::boolean, false),
      coalesce(nullif(v_capability->>'evidence_ref', ''), p_payload->>'external_ref'),
      false,
      now()
    )
    on conflict (project_id, source_id, capability_key) do update
    set provider = excluded.provider,
        access_mode = excluded.access_mode,
        status = excluded.status,
        mutates_external = excluded.mutates_external,
        owner_gate_required = excluded.owner_gate_required,
        evidence_ref = excluded.evidence_ref,
        contains_secrets = false,
        last_verified_at = now(),
        updated_at = now();
  end loop;

  return v_checkpoint;
end;
$$;

revoke all on function public.record_context_bridge_checkpoint(jsonb) from public, anon, authenticated;
grant execute on function public.record_context_bridge_checkpoint(jsonb) to service_role;

create or replace function public.create_context_bridge_manifest(p_payload jsonb)
returns public.context_bridge_manifests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_project_id text := coalesce(nullif(btrim(p_payload->>'project_id'), ''), 'hocker-one');
  v_next_version integer;
  v_previous_id uuid;
  v_manifest public.context_bridge_manifests%rowtype;
  v_coverage jsonb;
begin
  if nullif(btrim(p_payload->>'title'), '') is null
     or nullif(btrim(p_payload->>'summary'), '') is null
     or nullif(btrim(p_payload->>'created_by'), '') is null then
    raise exception 'CONTEXT_MANIFEST_REQUIRED_FIELDS_MISSING';
  end if;
  if coalesce((p_payload->>'contains_secrets')::boolean, false) then
    raise exception 'CONTEXT_MANIFEST_CONTAINS_SECRETS';
  end if;
  if coalesce(p_payload->>'content_hash', '') !~ '^[a-f0-9]{64}$' then
    raise exception 'CONTEXT_MANIFEST_HASH_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('context-bridge:' || v_project_id, 0));

  select coalesce(max(manifest_version), 0) + 1
  into v_next_version
  from public.context_bridge_manifests
  where project_id = v_project_id;

  select id into v_previous_id
  from public.context_bridge_manifests
  where project_id = v_project_id
  order by manifest_version desc
  limit 1;

  insert into public.context_bridge_manifests (
    project_id,
    manifest_version,
    scope,
    title,
    summary,
    state,
    source_ids,
    checkpoint_ids,
    canonical_refs,
    capability_snapshot,
    coverage_snapshot,
    content_hash,
    previous_manifest_id,
    contains_secrets,
    owner_approved,
    created_by
  ) values (
    v_project_id,
    v_next_version,
    p_payload->>'scope',
    p_payload->>'title',
    p_payload->>'summary',
    'draft',
    array(select jsonb_array_elements_text(coalesce(p_payload->'source_ids', '[]'::jsonb))),
    array(select value::text::uuid from jsonb_array_elements_text(coalesce(p_payload->'checkpoint_ids', '[]'::jsonb)) as ids(value)),
    coalesce(p_payload->'canonical_refs', '[]'::jsonb),
    coalesce(p_payload->'capability_snapshot', '[]'::jsonb),
    coalesce(p_payload->'coverage_snapshot', '[]'::jsonb),
    p_payload->>'content_hash',
    v_previous_id,
    false,
    false,
    p_payload->>'created_by'
  )
  returning * into v_manifest;

  for v_coverage in
    select value from jsonb_array_elements(coalesce(p_payload->'coverage_snapshot', '[]'::jsonb))
  loop
    insert into public.context_bridge_coverage (
      project_id,
      manifest_id,
      domain_key,
      expected_refs,
      verified_refs,
      status,
      missing_refs,
      evidence_refs,
      contains_secrets,
      verified_at
    ) values (
      v_project_id,
      v_manifest.id,
      v_coverage->>'domain_key',
      coalesce((v_coverage->>'expected_refs')::integer, 0),
      coalesce((v_coverage->>'verified_refs')::integer, 0),
      v_coverage->>'status',
      coalesce(v_coverage->'missing_refs', '[]'::jsonb),
      coalesce(v_coverage->'evidence_refs', '[]'::jsonb),
      false,
      nullif(v_coverage->>'verified_at', '')::timestamptz
    );
  end loop;

  return v_manifest;
end;
$$;

revoke all on function public.create_context_bridge_manifest(jsonb) from public, anon, authenticated;
grant execute on function public.create_context_bridge_manifest(jsonb) to service_role;

create or replace function public.activate_context_bridge_manifest(
  p_manifest_id uuid,
  p_approved_by text
)
returns public.context_bridge_manifests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.context_bridge_manifests%rowtype;
begin
  if nullif(btrim(p_approved_by), '') is null then
    raise exception 'OWNER_APPROVAL_REQUIRED';
  end if;

  select * into target
  from public.context_bridge_manifests
  where id = p_manifest_id
  for update;

  if not found then
    raise exception 'CONTEXT_MANIFEST_NOT_FOUND';
  end if;
  if target.contains_secrets then
    raise exception 'CONTEXT_MANIFEST_CONTAINS_SECRETS';
  end if;
  if target.state = 'invalid' then
    raise exception 'CONTEXT_MANIFEST_INVALID';
  end if;
  if not exists (
    select 1 from public.context_bridge_coverage where manifest_id = target.id
  ) or exists (
    select 1
    from public.context_bridge_coverage
    where manifest_id = target.id and status <> 'complete'
  ) then
    raise exception 'CONTEXT_MANIFEST_COVERAGE_INCOMPLETE';
  end if;

  update public.context_bridge_manifests
  set state = 'superseded', updated_at = now()
  where project_id = target.project_id
    and state = 'active'
    and id <> target.id;

  update public.context_bridge_manifests
  set state = 'active',
      owner_approved = true,
      approved_by = btrim(p_approved_by),
      approved_at = now(),
      updated_at = now()
  where id = target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.activate_context_bridge_manifest(uuid, text) from public, anon, authenticated;
grant execute on function public.activate_context_bridge_manifest(uuid, text) to service_role;

comment on table public.context_bridge_checkpoints is
  'Normalized summaries, decisions, cursors and provenance only. Raw conversations and secrets are forbidden.';
comment on table public.context_bridge_manifests is
  'Versioned operational context. Activation is service-only and must follow the Hocker ONE Owner Gate.';
