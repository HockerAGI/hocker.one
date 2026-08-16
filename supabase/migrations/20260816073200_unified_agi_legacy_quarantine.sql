-- Preserve all legacy NOVA history without silently assigning unknown ownership.
-- Production audit 2026-08-16 found most historical nova_threads have user_id = null.
-- Those sessions are migrated as legacy_unowned/reconcile_required and cannot be claimed
-- merely by knowing a thread UUID. Messages without an exact project+thread match are
-- preserved in deterministic quarantine sessions instead of being discarded or cross-linked.

create or replace function public.ensure_agi_session(
  p_thread_id uuid,
  p_project_id text,
  p_user_id uuid,
  p_agi_id text,
  p_title text default null,
  p_channel text default 'hocker-one',
  p_surface text default null
)
returns table(session_id uuid, thread_id uuid)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session public.agi_sessions%rowtype;
begin
  if p_thread_id is null then raise exception 'AGI_THREAD_ID_REQUIRED'; end if;
  if p_project_id is null or btrim(p_project_id) = '' then raise exception 'AGI_PROJECT_ID_REQUIRED'; end if;
  if p_user_id is null then raise exception 'AGI_USER_ID_REQUIRED'; end if;
  if p_agi_id is null or btrim(p_agi_id) = '' then raise exception 'AGI_ID_REQUIRED'; end if;

  select s.* into v_session
  from public.agi_sessions s
  where s.project_id = p_project_id
    and s.agi_id = lower(p_agi_id)
    and s.thread_id = p_thread_id
  for update;

  if found then
    if v_session.user_id is null
      or v_session.status in ('legacy_unowned', 'legacy_unmatched')
      or v_session.consent_state = 'reconcile_required' then
      raise exception 'AGI_SESSION_OWNERSHIP_RECONCILIATION_REQUIRED';
    end if;
    if v_session.user_id is distinct from p_user_id then
      raise exception 'AGI_SESSION_ACCESS_DENIED';
    end if;

    update public.agi_sessions
    set title = left(coalesce(nullif(btrim(p_title), ''), title), 240),
        channel = coalesce(nullif(btrim(p_channel), ''), channel),
        surface = coalesce(nullif(btrim(p_surface), ''), surface),
        updated_at = now()
    where id = v_session.id
    returning * into v_session;
  else
    insert into public.agi_sessions(
      thread_id, project_id, agi_id, user_id, channel, surface, title,
      legacy_sync_state, meta
    ) values (
      p_thread_id, p_project_id, lower(p_agi_id), p_user_id,
      coalesce(nullif(btrim(p_channel), ''), 'hocker-one'), nullif(btrim(p_surface), ''),
      left(nullif(btrim(p_title), ''), 240),
      case when lower(p_agi_id) = 'nova' then 'pending' else 'not_applicable' end,
      jsonb_build_object('provider_independent', true)
    ) returning * into v_session;
  end if;

  return query select v_session.id, v_session.thread_id;
end;
$function$;

revoke all on function public.ensure_agi_session(uuid,text,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.ensure_agi_session(uuid,text,uuid,text,text,text,text) to service_role;

create or replace function public.backfill_legacy_nova_sessions()
returns table(session_count bigint, message_count bigint, unmapped_message_count bigint)
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- Exact legacy threads. Unknown ownership is retained as null and quarantined from normal access.
  insert into public.agi_sessions(
    thread_id, project_id, agi_id, user_id, channel, surface, title, summary,
    consent_state, status, legacy_source, legacy_id, legacy_sync_state, legacy_synced_at,
    meta, created_at, updated_at
  )
  select
    t.thread_id,
    t.project_id,
    'nova',
    t.user_id,
    'hocker-one',
    'legacy-nova',
    t.title,
    t.summary,
    case when t.user_id is null then 'reconcile_required' else 'authorized' end,
    case when t.user_id is null then 'legacy_unowned' else 'active' end,
    'nova_threads',
    t.id,
    'synced',
    coalesce(t.updated_at, now()),
    coalesce(t.meta, '{}'::jsonb) || jsonb_build_object(
      'backfilled', true,
      'provider_independent', true,
      'legacy_ownership_verified', t.user_id is not null
    ),
    coalesce(t.created_at, now()),
    coalesce(t.updated_at, now())
  from public.nova_threads t
  where t.thread_id is not null
    and t.project_id is not null
    and btrim(t.project_id) <> ''
  on conflict (project_id, agi_id, thread_id) do update
    set legacy_source = coalesce(public.agi_sessions.legacy_source, excluded.legacy_source),
        legacy_id = coalesce(public.agi_sessions.legacy_id, excluded.legacy_id),
        meta = public.agi_sessions.meta || jsonb_build_object(
          'legacy_thread_observed', true,
          'legacy_ownership_verified', excluded.user_id is not null
        );

  -- Any legacy message without an exact legacy thread in the same project gets a deterministic
  -- synthetic session UUID. The original raw thread identifier is preserved in meta.
  with unmatched as (
    select distinct
      m.project_id,
      m.thread_id as legacy_thread_id_raw,
      md5('hocker-nova-legacy-quarantine:' || m.project_id || ':' || m.thread_id) as digest
    from public.nova_messages m
    where not exists (
      select 1
      from public.nova_threads t
      where t.project_id = m.project_id
        and t.thread_id::text = m.thread_id
    )
  )
  insert into public.agi_sessions(
    thread_id, project_id, agi_id, user_id, channel, surface, title,
    consent_state, status, legacy_sync_state, meta
  )
  select
    format(
      '%s-%s-%s-%s-%s',
      substr(u.digest, 1, 8),
      substr(u.digest, 9, 4),
      substr(u.digest, 13, 4),
      substr(u.digest, 17, 4),
      substr(u.digest, 21, 12)
    )::uuid,
    u.project_id,
    'nova',
    null,
    'hocker-one',
    'legacy-quarantine',
    'Legacy NOVA history pending ownership reconciliation',
    'reconcile_required',
    'legacy_unmatched',
    'external_legacy',
    jsonb_build_object(
      'backfilled', true,
      'provider_independent', true,
      'legacy_thread_id_raw', u.legacy_thread_id_raw,
      'synthetic_thread_id', true,
      'legacy_ownership_verified', false
    )
  from unmatched u
  on conflict (project_id, agi_id, thread_id) do update
    set meta = public.agi_sessions.meta || excluded.meta,
        status = case when public.agi_sessions.user_id is null then 'legacy_unmatched' else public.agi_sessions.status end,
        consent_state = case when public.agi_sessions.user_id is null then 'reconcile_required' else public.agi_sessions.consent_state end;

  -- Map every legacy message to either its exact legacy thread session or its quarantine session.
  insert into public.agi_messages(
    session_id, project_id, agi_id, message_key, role, content, provider, model,
    legacy_source, legacy_id, meta, created_at
  )
  select
    target.session_id,
    m.project_id,
    'nova',
    'legacy:' || m.id::text,
    case
      when m.role in ('assistant', 'nova') then 'assistant'
      when m.role = 'user' then 'user'
      when m.role = 'system' then 'system'
      else 'system'
    end,
    m.content,
    nullif(m.meta->>'provider', ''),
    nullif(m.meta->>'model', ''),
    'nova_messages',
    m.id,
    coalesce(m.meta, '{}'::jsonb) || jsonb_build_object('backfilled', true),
    coalesce(m.created_at::timestamptz, now())
  from public.nova_messages m
  join lateral (
    select s.id as session_id
    from public.agi_sessions s
    where s.project_id = m.project_id
      and s.agi_id = 'nova'
      and (
        (s.legacy_source = 'nova_threads' and s.thread_id::text = m.thread_id)
        or
        (s.status = 'legacy_unmatched' and s.meta->>'legacy_thread_id_raw' = m.thread_id)
      )
    order by case when s.legacy_source = 'nova_threads' then 0 else 1 end, s.created_at asc
    limit 1
  ) target on true
  on conflict (legacy_source, legacy_id)
    where legacy_source is not null and legacy_id is not null
  do nothing;

  return query
  select
    (select count(*) from public.agi_sessions where agi_id = 'nova' and (legacy_source = 'nova_threads' or status = 'legacy_unmatched')),
    (select count(*) from public.agi_messages where legacy_source = 'nova_messages'),
    (select count(*)
       from public.nova_messages m
       where not exists (
         select 1 from public.agi_messages am
         where am.legacy_source = 'nova_messages' and am.legacy_id = m.id
       ));
end;
$function$;

revoke all on function public.backfill_legacy_nova_sessions() from public, anon, authenticated;
grant execute on function public.backfill_legacy_nova_sessions() to service_role;

create or replace function public.reconcile_legacy_agi_session_owner(
  p_session_id uuid,
  p_user_id uuid,
  p_evidence_ref text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id uuid;
begin
  if p_session_id is null or p_user_id is null then
    raise exception 'AGI_SESSION_RECONCILIATION_INPUT_REQUIRED';
  end if;
  if p_evidence_ref is null or length(btrim(p_evidence_ref)) < 8 then
    raise exception 'AGI_SESSION_RECONCILIATION_EVIDENCE_REQUIRED';
  end if;

  update public.agi_sessions
  set user_id = p_user_id,
      consent_state = 'authorized',
      status = 'active',
      meta = meta || jsonb_build_object(
        'ownership_reconciled', true,
        'ownership_reconciled_at', now(),
        'ownership_evidence_ref', left(btrim(p_evidence_ref), 500)
      ),
      updated_at = now()
  where id = p_session_id
    and user_id is null
    and status in ('legacy_unowned', 'legacy_unmatched')
    and consent_state = 'reconcile_required'
  returning id into v_id;

  if v_id is null then
    raise exception 'AGI_SESSION_NOT_RECONCILABLE';
  end if;
  return v_id;
end;
$function$;

revoke all on function public.reconcile_legacy_agi_session_owner(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.reconcile_legacy_agi_session_owner(uuid,uuid,text) to service_role;

comment on function public.reconcile_legacy_agi_session_owner(uuid,uuid,text) is
  'Service-only ownership reconciliation for quarantined legacy AGI sessions. Application use must remain Owner-gated and evidence-backed.';
