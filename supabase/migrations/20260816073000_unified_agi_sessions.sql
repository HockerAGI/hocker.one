-- HOCKER unified AGI sessions: additive, provider-independent durable conversation state.
-- Legacy NOVA tables remain intact during compatibility window.

create table if not exists public.agi_sessions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,
  project_id text not null,
  agi_id text not null,
  tenant_id text,
  user_id uuid,
  client_id text,
  app_id text,
  channel text not null default 'hocker-one',
  surface text,
  title text,
  summary text,
  retention_policy text not null default 'durable',
  consent_state text not null default 'authorized',
  status text not null default 'active',
  legacy_source text,
  legacy_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agi_sessions_project_agi_thread_key unique (project_id, agi_id, thread_id)
);

create table if not exists public.agi_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agi_sessions(id) on delete restrict,
  project_id text not null,
  agi_id text not null,
  role text not null check (role in ('system','user','assistant','tool')),
  content text not null,
  classification text not null default 'conversation',
  trace_id uuid,
  provider text,
  model text,
  tokens_in integer check (tokens_in is null or tokens_in >= 0),
  tokens_out integer check (tokens_out is null or tokens_out >= 0),
  legacy_source text,
  legacy_id uuid,
  learning_processed_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agi_sessions_user_project_idx
  on public.agi_sessions(project_id, user_id, updated_at desc);
create index if not exists agi_sessions_agi_updated_idx
  on public.agi_sessions(project_id, agi_id, updated_at desc);
create index if not exists agi_messages_session_created_idx
  on public.agi_messages(session_id, created_at desc);
create unique index if not exists agi_messages_legacy_unique_idx
  on public.agi_messages(legacy_source, legacy_id)
  where legacy_source is not null and legacy_id is not null;

alter table public.agi_sessions enable row level security;
alter table public.agi_messages enable row level security;

revoke all on table public.agi_sessions from public, anon, authenticated;
revoke all on table public.agi_messages from public, anon, authenticated;
grant select, insert, update, delete on table public.agi_sessions to service_role;
grant select, insert, update, delete on table public.agi_messages to service_role;

create or replace function public.ensure_agi_session(
  p_thread_id uuid,
  p_project_id text,
  p_user_id uuid,
  p_agi_id text,
  p_title text default null,
  p_channel text default 'hocker-one',
  p_surface text default null,
  p_sync_legacy_nova boolean default false
)
returns table(session_id uuid, thread_id uuid)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session public.agi_sessions%rowtype;
  v_thread public.nova_threads%rowtype;
begin
  if p_thread_id is null then raise exception 'AGI_THREAD_ID_REQUIRED'; end if;
  if p_project_id is null or btrim(p_project_id) = '' then raise exception 'AGI_PROJECT_ID_REQUIRED'; end if;
  if p_user_id is null then raise exception 'AGI_USER_ID_REQUIRED'; end if;
  if p_agi_id is null or btrim(p_agi_id) = '' then raise exception 'AGI_ID_REQUIRED'; end if;

  if p_sync_legacy_nova and lower(p_agi_id) = 'nova' then
    select t.* into v_thread
    from public.nova_threads t
    where t.thread_id = p_thread_id
    for update;

    if found then
      if coalesce(v_thread.project_id, '') <> p_project_id
        or v_thread.user_id is distinct from p_user_id then
        raise exception 'NOVA_THREAD_ACCESS_DENIED';
      end if;
      update public.nova_threads
      set title = left(coalesce(nullif(btrim(p_title), ''), title), 240), updated_at = now()
      where id = v_thread.id;
    else
      insert into public.nova_threads(thread_id, project_id, user_id, title, updated_at)
      values (p_thread_id, p_project_id, p_user_id, left(nullif(btrim(p_title), ''), 240), now())
      returning * into v_thread;
    end if;
  end if;

  select s.* into v_session
  from public.agi_sessions s
  where s.project_id = p_project_id
    and s.agi_id = lower(p_agi_id)
    and s.thread_id = p_thread_id
  for update;

  if found then
    if v_session.user_id is not null and v_session.user_id is distinct from p_user_id then
      raise exception 'AGI_SESSION_ACCESS_DENIED';
    end if;
    update public.agi_sessions
    set user_id = coalesce(user_id, p_user_id),
        title = left(coalesce(nullif(btrim(p_title), ''), title), 240),
        channel = coalesce(nullif(btrim(p_channel), ''), channel),
        surface = coalesce(nullif(btrim(p_surface), ''), surface),
        updated_at = now()
    where id = v_session.id
    returning * into v_session;
  else
    insert into public.agi_sessions(
      thread_id, project_id, agi_id, user_id, channel, surface, title,
      legacy_source, legacy_id, meta
    ) values (
      p_thread_id, p_project_id, lower(p_agi_id), p_user_id,
      coalesce(nullif(btrim(p_channel), ''), 'hocker-one'), nullif(btrim(p_surface), ''),
      left(nullif(btrim(p_title), ''), 240),
      case when p_sync_legacy_nova and lower(p_agi_id) = 'nova' then 'nova_threads' else null end,
      case when p_sync_legacy_nova and lower(p_agi_id) = 'nova' then v_thread.id else null end,
      jsonb_build_object('provider_independent', true)
    ) returning * into v_session;
  end if;

  return query select v_session.id, v_session.thread_id;
end;
$function$;

revoke all on function public.ensure_agi_session(uuid,text,uuid,text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.ensure_agi_session(uuid,text,uuid,text,text,text,text,boolean) to service_role;

create or replace function public.append_agi_message(
  p_session_id uuid,
  p_project_id text,
  p_agi_id text,
  p_role text,
  p_content text,
  p_trace_id uuid default null,
  p_provider text default null,
  p_model text default null,
  p_tokens_in integer default null,
  p_tokens_out integer default null,
  p_meta jsonb default '{}'::jsonb,
  p_sync_legacy_nova boolean default false
)
returns table(message_id uuid, legacy_message_id uuid, usage_id uuid)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session public.agi_sessions%rowtype;
  v_message_id uuid;
  v_legacy_message_id uuid;
  v_usage_id uuid;
begin
  if p_session_id is null then raise exception 'AGI_SESSION_ID_REQUIRED'; end if;
  if p_content is null or btrim(p_content) = '' then raise exception 'AGI_MESSAGE_CONTENT_REQUIRED'; end if;
  if p_role not in ('system','user','assistant','tool') then raise exception 'AGI_MESSAGE_ROLE_INVALID'; end if;

  select s.* into v_session
  from public.agi_sessions s
  where s.id = p_session_id
    and s.project_id = p_project_id
    and s.agi_id = lower(p_agi_id)
  for update;
  if not found then raise exception 'AGI_SESSION_ACCESS_DENIED'; end if;

  if p_sync_legacy_nova and lower(p_agi_id) = 'nova' and p_role in ('user','assistant') then
    insert into public.nova_messages(project_id, thread_id, role, content, meta)
    values (p_project_id, v_session.thread_id::text, p_role, p_content, coalesce(p_meta, '{}'::jsonb))
    returning id into v_legacy_message_id;
  end if;

  insert into public.agi_messages(
    session_id, project_id, agi_id, role, content, trace_id, provider, model,
    tokens_in, tokens_out, legacy_source, legacy_id, meta
  ) values (
    p_session_id, p_project_id, lower(p_agi_id), p_role, p_content, p_trace_id,
    nullif(btrim(p_provider), ''), nullif(btrim(p_model), ''), p_tokens_in, p_tokens_out,
    case when v_legacy_message_id is not null then 'nova_messages' else null end,
    v_legacy_message_id, coalesce(p_meta, '{}'::jsonb)
  ) returning id into v_message_id;

  if p_role = 'assistant' and nullif(btrim(p_provider), '') is not null and nullif(btrim(p_model), '') is not null then
    insert into public.llm_usage(project_id, thread_id, provider, model, tokens_in, tokens_out, meta)
    values (
      p_project_id, v_session.thread_id::text, p_provider, p_model, p_tokens_in, p_tokens_out,
      coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('agi_session_id', p_session_id, 'agi_message_id', v_message_id)
    ) returning id into v_usage_id;
  end if;

  update public.agi_sessions set updated_at = now() where id = p_session_id;
  return query select v_message_id, v_legacy_message_id, v_usage_id;
end;
$function$;

revoke all on function public.append_agi_message(uuid,text,text,text,text,uuid,text,text,integer,integer,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.append_agi_message(uuid,text,text,text,text,uuid,text,text,integer,integer,jsonb,boolean) to service_role;

create or replace function public.backfill_legacy_nova_sessions()
returns table(session_count bigint, message_count bigint, unmapped_message_count bigint)
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.agi_sessions(
    thread_id, project_id, agi_id, user_id, channel, surface, title, summary,
    legacy_source, legacy_id, meta, created_at, updated_at
  )
  select
    t.thread_id, t.project_id, 'nova', t.user_id, 'hocker-one', 'legacy-nova',
    t.title, t.summary, 'nova_threads', t.id,
    coalesce(t.meta, '{}'::jsonb) || jsonb_build_object('backfilled', true, 'provider_independent', true),
    coalesce(t.created_at, now()), coalesce(t.updated_at, now())
  from public.nova_threads t
  where t.thread_id is not null and t.project_id is not null
  on conflict (project_id, agi_id, thread_id) do nothing;

  insert into public.agi_messages(
    session_id, project_id, agi_id, role, content, provider, model,
    legacy_source, legacy_id, meta, created_at
  )
  select
    s.id, m.project_id, 'nova',
    case when m.role in ('assistant','nova') then 'assistant' when m.role = 'user' then 'user' else 'system' end,
    m.content, nullif(m.meta->>'provider',''), nullif(m.meta->>'model',''),
    'nova_messages', m.id,
    coalesce(m.meta, '{}'::jsonb) || jsonb_build_object('backfilled', true),
    coalesce(m.created_at::timestamptz, now())
  from public.nova_messages m
  join public.agi_sessions s
    on s.project_id = m.project_id
   and s.agi_id = 'nova'
   and s.thread_id::text = m.thread_id
  on conflict (legacy_source, legacy_id) where legacy_source is not null and legacy_id is not null do nothing;

  return query
  select
    (select count(*) from public.agi_sessions where legacy_source = 'nova_threads'),
    (select count(*) from public.agi_messages where legacy_source = 'nova_messages'),
    (select count(*) from public.nova_messages m
       where not exists (
         select 1 from public.agi_sessions s
         where s.project_id = m.project_id and s.agi_id = 'nova' and s.thread_id::text = m.thread_id
       ));
end;
$function$;

revoke all on function public.backfill_legacy_nova_sessions() from public, anon, authenticated;
grant execute on function public.backfill_legacy_nova_sessions() to service_role;

comment on table public.agi_sessions is 'Provider-independent durable AGI conversation/session identity. Legacy NOVA rows remain during compatibility window.';
comment on table public.agi_messages is 'Provider-independent durable AGI message history; provider/model are telemetry, not AGI identity.';
comment on function public.backfill_legacy_nova_sessions() is 'Idempotently maps legacy nova_threads/nova_messages into the unified AGI session store and reports unmapped message count.';
