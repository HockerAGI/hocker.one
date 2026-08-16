-- Link exact legacy nova.agi fallback rows to the provider-independent AGI Session Store.
-- Hocker One injects hocker_runtime.request_trace_id into context_data. The dedicated
-- NOVA runtime already persists that context_data on the user message and its own
-- trace_id on the assistant message. This function uses those two durable identifiers;
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

comment on function public.link_dedicated_nova_fallback_turn(uuid,uuid,uuid,text,text) is
  'Links exact dedicated nova.agi legacy messages to the canonical AGI Session Store using request/dedicated trace IDs; no content heuristics.';
