-- Link exact legacy nova.agi fallback rows to the provider-independent AGI Session Store.
-- Hocker One injects hocker_runtime.request_trace_id into context_data. The dedicated
-- NOVA runtime already persists that context_data on the user message and its own
-- trace_id on the assistant message. This uses those durable identifiers only;
-- it never matches by message content.

create or replace function public.link_dedicated_nova_fallback_turn(
  p_session_id uuid,
  p_user_message_id uuid,
  p_assistant_message_id uuid,
  p_request_trace_id text,
  p_dedicated_trace_id text
)
returns table(legacy_user_message_id uuid, legacy_assistant_message_id uuid)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session public.agi_sessions%rowtype;
  v_user public.agi_messages%rowtype;
  v_assistant public.agi_messages%rowtype;
  v_legacy_user uuid;
  v_legacy_assistant uuid;
begin
  if p_session_id is null or p_user_message_id is null or p_assistant_message_id is null then
    raise exception 'NOVA_FALLBACK_LINK_IDS_REQUIRED';
  end if;
  if p_request_trace_id is null or length(btrim(p_request_trace_id)) < 8 then
    raise exception 'NOVA_FALLBACK_REQUEST_TRACE_REQUIRED';
  end if;
  if p_dedicated_trace_id is null or length(btrim(p_dedicated_trace_id)) < 8 then
    raise exception 'NOVA_FALLBACK_DEDICATED_TRACE_REQUIRED';
  end if;

  select s.* into v_session
  from public.agi_sessions s
  where s.id = p_session_id and s.agi_id = 'nova'
  for update;
  if not found then raise exception 'NOVA_FALLBACK_SESSION_NOT_FOUND'; end if;

  select m.* into v_user
  from public.agi_messages m
  where m.id = p_user_message_id and m.session_id = p_session_id and m.role = 'user';
  if not found then raise exception 'NOVA_FALLBACK_USER_MESSAGE_NOT_FOUND'; end if;

  select m.* into v_assistant
  from public.agi_messages m
  where m.id = p_assistant_message_id and m.session_id = p_session_id and m.role = 'assistant';
  if not found then raise exception 'NOVA_FALLBACK_ASSISTANT_MESSAGE_NOT_FOUND'; end if;

  select m.id into v_legacy_user
  from public.nova_messages m
  where m.project_id = v_session.project_id
    and m.thread_id = v_session.thread_id::text
    and m.meta #>> '{context_data,hocker_runtime,request_trace_id}' = btrim(p_request_trace_id)
    and m.role = 'user'
  order by m.created_at desc, m.id desc
  limit 1;

  select m.id into v_legacy_assistant
  from public.nova_messages m
  where m.project_id = v_session.project_id
    and m.thread_id = v_session.thread_id::text
    and m.meta->>'trace_id' = btrim(p_dedicated_trace_id)
    and m.role in ('assistant', 'nova')
  order by m.created_at desc, m.id desc
  limit 1;

  if v_legacy_user is null then raise exception 'NOVA_FALLBACK_LEGACY_USER_NOT_FOUND'; end if;
  if v_legacy_assistant is null then raise exception 'NOVA_FALLBACK_LEGACY_ASSISTANT_NOT_FOUND'; end if;

  if exists (
    select 1 from public.agi_messages m
    where m.legacy_source = 'nova_messages' and m.legacy_id = v_legacy_user and m.id <> v_user.id
  ) then raise exception 'NOVA_FALLBACK_LEGACY_USER_ALREADY_LINKED'; end if;
  if exists (
    select 1 from public.agi_messages m
    where m.legacy_source = 'nova_messages' and m.legacy_id = v_legacy_assistant and m.id <> v_assistant.id
  ) then raise exception 'NOVA_FALLBACK_LEGACY_ASSISTANT_ALREADY_LINKED'; end if;

  update public.agi_messages
  set legacy_source = 'nova_messages', legacy_id = v_legacy_user,
      meta = meta || jsonb_build_object('dedicated_fallback_legacy_linked', true)
  where id = v_user.id;

  update public.agi_messages
  set legacy_source = 'nova_messages', legacy_id = v_legacy_assistant,
      meta = meta || jsonb_build_object('dedicated_fallback_legacy_linked', true)
  where id = v_assistant.id;

  update public.agi_sessions
  set legacy_sync_state = 'external_fallback_linked',
      legacy_synced_at = now(),
      legacy_sync_error = null,
      updated_at = now(),
      meta = meta || jsonb_build_object(
        'dedicated_fallback_linked', true,
        'dedicated_fallback_request_trace_id', left(btrim(p_request_trace_id), 240),
        'dedicated_fallback_trace_id', left(btrim(p_dedicated_trace_id), 240)
      )
  where id = p_session_id;

  return query select v_legacy_user, v_legacy_assistant;
end;
$function$;

revoke all on function public.link_dedicated_nova_fallback_turn(uuid,uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.link_dedicated_nova_fallback_turn(uuid,uuid,uuid,text,text) to service_role;

create or replace function public.link_imported_dedicated_nova_fallback_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_request_trace text;
  v_dedicated_trace text;
  v_user_message_id uuid;
begin
  if new.role <> 'assistant'
    or new.meta->>'runtime' <> 'nova-dedicated-compatibility-import' then
    return new;
  end if;

  if new.message_key is null or new.message_key !~ ':assistant$' then
    raise exception 'NOVA_FALLBACK_IMPORTED_MESSAGE_KEY_INVALID';
  end if;

  v_request_trace := regexp_replace(new.message_key, ':assistant$', '');
  v_dedicated_trace := nullif(btrim(new.meta->>'dedicated_trace_id'), '');
  if v_dedicated_trace is null then
    raise exception 'NOVA_FALLBACK_DEDICATED_TRACE_REQUIRED';
  end if;

  select m.id into v_user_message_id
  from public.agi_messages m
  where m.session_id = new.session_id
    and m.message_key = v_request_trace || ':user'
    and m.role = 'user'
  limit 1;
  if v_user_message_id is null then
    raise exception 'NOVA_FALLBACK_USER_MESSAGE_NOT_FOUND';
  end if;

  perform 1
  from public.link_dedicated_nova_fallback_turn(
    new.session_id,
    v_user_message_id,
    new.id,
    v_request_trace,
    v_dedicated_trace
  );

  return new;
end;
$function$;

revoke all on function public.link_imported_dedicated_nova_fallback_message() from public, anon, authenticated;
grant execute on function public.link_imported_dedicated_nova_fallback_message() to service_role;

drop trigger if exists agi_messages_link_dedicated_nova_fallback on public.agi_messages;
create trigger agi_messages_link_dedicated_nova_fallback
after insert on public.agi_messages
for each row
when (
  new.role = 'assistant'
  and new.meta->>'runtime' = 'nova-dedicated-compatibility-import'
)
execute function public.link_imported_dedicated_nova_fallback_message();

comment on function public.link_dedicated_nova_fallback_turn(uuid,uuid,uuid,text,text) is
  'Links exact dedicated nova.agi legacy messages to the canonical AGI Session Store using request/dedicated trace IDs; no content heuristics.';
comment on function public.link_imported_dedicated_nova_fallback_message() is
  'Fail-closed trigger hook: imported dedicated fallback assistants must link to exact legacy rows before their insert can commit.';
