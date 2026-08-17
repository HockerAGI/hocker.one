begin;

create table if not exists public.owner_gate_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  actor_type text not null check (actor_type in ('owner', 'internal')),
  gate_version text not null,
  accepted_header text not null check (accepted_header in ('x-hocker-owner-key', 'x-hocker-internal-key', 'authorization')),
  action text not null,
  resource_type text not null,
  resource_id text not null,
  candidate_sha text not null,
  environment text not null,
  trace_id uuid not null,
  nonce uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  approval_hash text not null check (approval_hash ~ '^[a-f0-9]{64}$'),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  approved_at timestamptz not null default now(),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_hash),
  unique (nonce)
);

alter table public.owner_gate_approvals enable row level security;
revoke all on table public.owner_gate_approvals from public, anon, authenticated;
grant all on table public.owner_gate_approvals to service_role;

create index if not exists owner_gate_approvals_resource_idx
  on public.owner_gate_approvals(project_id, resource_type, resource_id, approved_at desc);
create index if not exists owner_gate_approvals_action_idx
  on public.owner_gate_approvals(project_id, action, approved_at desc);

alter table public.context_bridge_manifests
  add column if not exists approval_id uuid references public.owner_gate_approvals(id) on delete restrict;

create or replace function public.record_owner_gate_approval(p_payload jsonb)
returns public.owner_gate_approvals
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id uuid := gen_random_uuid();
  v_actor text := nullif(btrim(p_payload->>'actor_type'), '');
  v_request_hash text := lower(coalesce(p_payload->>'request_hash', ''));
  v_nonce uuid;
  v_trace_id uuid;
  v_approval public.owner_gate_approvals%rowtype;
begin
  if v_actor not in ('owner', 'internal') then raise exception 'OWNER_GATE_ACTOR_INVALID'; end if;
  if nullif(btrim(p_payload->>'project_id'), '') is null
     or nullif(btrim(p_payload->>'gate_version'), '') is null
     or nullif(btrim(p_payload->>'accepted_header'), '') is null
     or nullif(btrim(p_payload->>'action'), '') is null
     or nullif(btrim(p_payload->>'resource_type'), '') is null
     or nullif(btrim(p_payload->>'resource_id'), '') is null
     or nullif(btrim(p_payload->>'candidate_sha'), '') is null
     or nullif(btrim(p_payload->>'environment'), '') is null then
    raise exception 'OWNER_GATE_EVIDENCE_REQUIRED';
  end if;
  if v_request_hash !~ '^[a-f0-9]{64}$' then raise exception 'OWNER_GATE_REQUEST_HASH_INVALID'; end if;
  v_nonce := (p_payload->>'nonce')::uuid;
  v_trace_id := (p_payload->>'trace_id')::uuid;

  insert into public.owner_gate_approvals (
    id, project_id, actor_type, gate_version, accepted_header,
    action, resource_type, resource_id, candidate_sha, environment,
    trace_id, nonce, request_hash, approval_hash, evidence
  ) values (
    v_id,
    btrim(p_payload->>'project_id'),
    v_actor,
    btrim(p_payload->>'gate_version'),
    btrim(p_payload->>'accepted_header'),
    btrim(p_payload->>'action'),
    btrim(p_payload->>'resource_type'),
    btrim(p_payload->>'resource_id'),
    btrim(p_payload->>'candidate_sha'),
    btrim(p_payload->>'environment'),
    v_trace_id,
    v_nonce,
    v_request_hash,
    encode(digest(convert_to(v_id::text || '|' || v_request_hash || '|' || v_nonce::text || '|' || v_trace_id::text, 'UTF8'), 'sha256'), 'hex'),
    coalesce(p_payload->'evidence', '{}'::jsonb)
  )
  returning * into v_approval;

  return v_approval;
end;
$$;

revoke all on function public.record_owner_gate_approval(jsonb) from public, anon, authenticated;
grant execute on function public.record_owner_gate_approval(jsonb) to service_role;

create or replace function public.activate_context_bridge_manifest_v2(
  p_manifest_id uuid,
  p_approval_id uuid
)
returns public.context_bridge_manifests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.context_bridge_manifests%rowtype;
  approval public.owner_gate_approvals%rowtype;
begin
  select * into approval
  from public.owner_gate_approvals
  where id = p_approval_id
  for update;

  if not found then raise exception 'OWNER_APPROVAL_EVIDENCE_NOT_FOUND'; end if;
  if approval.actor_type <> 'owner' then raise exception 'OWNER_APPROVAL_REQUIRED'; end if;
  if approval.action <> 'context_bridge.activate_manifest'
     or approval.resource_type <> 'context_bridge_manifest'
     or approval.resource_id <> p_manifest_id::text then
    raise exception 'OWNER_APPROVAL_SCOPE_MISMATCH';
  end if;
  if approval.consumed_at is not null then raise exception 'OWNER_APPROVAL_ALREADY_CONSUMED'; end if;
  if approval.approved_at < now() - interval '15 minutes' then raise exception 'OWNER_APPROVAL_EXPIRED'; end if;

  select * into target
  from public.context_bridge_manifests
  where id = p_manifest_id
  for update;

  if not found then raise exception 'CONTEXT_MANIFEST_NOT_FOUND'; end if;
  if target.project_id <> approval.project_id then raise exception 'OWNER_APPROVAL_PROJECT_MISMATCH'; end if;
  if target.contains_secrets then raise exception 'CONTEXT_MANIFEST_CONTAINS_SECRETS'; end if;
  if target.state = 'invalid' then raise exception 'CONTEXT_MANIFEST_INVALID'; end if;
  if not exists (select 1 from public.context_bridge_coverage where manifest_id = target.id)
     or exists (select 1 from public.context_bridge_coverage where manifest_id = target.id and status <> 'complete') then
    raise exception 'CONTEXT_MANIFEST_COVERAGE_INCOMPLETE';
  end if;

  update public.context_bridge_manifests
  set state = 'superseded', updated_at = now()
  where project_id = target.project_id and state = 'active' and id <> target.id;

  update public.context_bridge_manifests
  set state = 'active',
      owner_approved = true,
      approval_id = approval.id,
      approved_by = 'owner-gate:' || approval.id::text,
      approved_at = approval.approved_at,
      updated_at = now()
  where id = target.id
  returning * into target;

  update public.owner_gate_approvals
  set consumed_at = now()
  where id = approval.id;

  return target;
end;
$$;

revoke all on function public.activate_context_bridge_manifest_v2(uuid, uuid) from public, anon, authenticated;
grant execute on function public.activate_context_bridge_manifest_v2(uuid, uuid) to service_role;

commit;
