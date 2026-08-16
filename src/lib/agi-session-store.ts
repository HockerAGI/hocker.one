import { createAdminSupabase } from "@/lib/supabase-admin";

type JsonRecord = Record<string, unknown>;
type RpcError = { message: string };
type RpcResult<T> = { data: T | null; error: RpcError | null };
type RpcClient = { rpc<T>(name: string, args: JsonRecord): PromiseLike<RpcResult<T>> };

export type AgiSessionRef = {
  session_id: string;
  thread_id: string;
};

export type AgiConversationMessage = {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at: string;
};

export type AgiConversationContext = {
  session_id: string;
  thread_id: string;
  project_id: string;
  agi_id: string;
  user_id: string | null;
  summary: string | null;
  recent_messages: AgiConversationMessage[];
  meta: JsonRecord;
};

export type EnsureAgiSessionInput = {
  thread_id: string;
  project_id: string;
  user_id: string;
  agi_id: string;
  title?: string | null;
  channel?: string;
  surface?: string | null;
};

export type AppendAgiMessageInput = {
  session_id: string;
  project_id: string;
  agi_id: string;
  message_key?: string | null;
  role: AgiConversationMessage["role"];
  content: string;
  trace_id?: string | null;
  provider?: string | null;
  model?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  meta?: JsonRecord;
};

export type LoadAgiConversationContextInput = {
  session_id: string;
  project_id: string;
  agi_id: string;
  user_id?: string | null;
  limit?: number;
};

export type UpdateAgiSessionSummaryInput = {
  session_id: string;
  project_id: string;
  agi_id: string;
  summary: string;
  meta_patch?: JsonRecord;
};

function db() {
  return createAdminSupabase();
}

function rpcDb(): RpcClient {
  return createAdminSupabase() as unknown as RpcClient;
}

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function errorCode(error: unknown): string {
  if (!(error instanceof Error)) return "AGI_LEGACY_SYNC_FAILED";
  return error.message.split(":")[0].replace(/[^A-Z0-9_]/gi, "_").toUpperCase().slice(0, 160);
}

export async function ensureAgiSession(input: EnsureAgiSessionInput): Promise<AgiSessionRef> {
  const { data, error } = await rpcDb().rpc<Array<{ session_id: string; thread_id: string }>>(
    "ensure_agi_session",
    {
      p_thread_id: input.thread_id,
      p_project_id: input.project_id,
      p_user_id: input.user_id,
      p_agi_id: input.agi_id,
      p_title: input.title ?? null,
      p_channel: input.channel ?? "hocker-one",
      p_surface: input.surface ?? null,
    },
  );

  const row = data?.[0];
  if (error || !row?.session_id || !row?.thread_id) {
    throw new Error(`AGI_SESSION_ENSURE_FAILED: ${error?.message ?? "empty_result"}`);
  }
  return row;
}

export async function appendAgiMessage(
  input: AppendAgiMessageInput,
): Promise<{ id: string; usage_id: string | null }> {
  const { data, error } = await rpcDb().rpc<
    Array<{ message_id: string; usage_id: string | null }>
  >("append_agi_message", {
    p_session_id: input.session_id,
    p_project_id: input.project_id,
    p_agi_id: input.agi_id,
    p_message_key: input.message_key ?? null,
    p_role: input.role,
    p_content: input.content,
    p_trace_id: input.trace_id ?? null,
    p_provider: input.provider ?? null,
    p_model: input.model ?? null,
    p_tokens_in: input.tokens_in ?? null,
    p_tokens_out: input.tokens_out ?? null,
    p_meta: input.meta ?? {},
  });

  const row = data?.[0];
  if (error || !row?.message_id) {
    throw new Error(`AGI_MESSAGE_APPEND_FAILED: ${error?.message ?? "empty_result"}`);
  }
  return { id: row.message_id, usage_id: row.usage_id ?? null };
}

export async function syncAgiTurnToLegacyNova(input: {
  session_id: string;
  user_message_id: string;
  assistant_message_id: string;
}): Promise<{ ok: boolean; error_code?: string }> {
  const { data, error } = await rpcDb().rpc<
    Array<{ legacy_user_message_id: string; legacy_assistant_message_id: string }>
  >("sync_agi_turn_to_legacy_nova", {
    p_session_id: input.session_id,
    p_user_message_id: input.user_message_id,
    p_assistant_message_id: input.assistant_message_id,
  });

  if (!error && data?.[0]?.legacy_user_message_id && data?.[0]?.legacy_assistant_message_id) {
    return { ok: true };
  }

  const code = errorCode(new Error(error?.message ?? "AGI_LEGACY_SYNC_EMPTY_RESULT"));
  await rpcDb().rpc<null>("mark_agi_legacy_sync_pending", {
    p_session_id: input.session_id,
    p_error_code: code,
  });
  return { ok: false, error_code: code };
}

export async function persistDedicatedNovaFallbackTurn(input: {
  thread_id: string;
  project_id: string;
  user_id: string;
  user_message: string;
  assistant_message: string;
  request_trace_id: string;
  provider?: string | null;
  model?: string | null;
  meta?: JsonRecord;
}): Promise<{ session_id: string; user_message_id: string; assistant_message_id: string }> {
  const session = await ensureAgiSession({
    thread_id: input.thread_id,
    project_id: input.project_id,
    user_id: input.user_id,
    agi_id: "nova",
    title: input.user_message.slice(0, 120),
    channel: "hocker-one",
    surface: "nova-chat",
  });

  const user = await appendAgiMessage({
    session_id: session.session_id,
    project_id: input.project_id,
    agi_id: "nova",
    message_key: `${input.request_trace_id}:user`,
    role: "user",
    content: input.user_message,
    trace_id: input.request_trace_id,
    meta: {
      runtime: "nova-dedicated-compatibility-import",
      imported_from_dedicated_fallback: true,
    },
  });

  // Do not pass provider/model into appendAgiMessage here: the dedicated runtime already
  // recorded its own usage. The AFTER INSERT trigger must link both exact legacy rows before
  // this assistant insert can commit. Provider/model telemetry is attached afterward only.
  const assistant = await appendAgiMessage({
    session_id: session.session_id,
    project_id: input.project_id,
    agi_id: "nova",
    message_key: `${input.request_trace_id}:assistant`,
    role: "assistant",
    content: input.assistant_message,
    trace_id: input.request_trace_id,
    meta: {
      ...(input.meta ?? {}),
      runtime: "nova-dedicated-compatibility-import",
      imported_from_dedicated_fallback: true,
      source_provider: input.provider ?? null,
      source_model: input.model ?? null,
    },
  });

  const { error: messageError } = await db()
    .from("agi_messages")
    .update({ provider: input.provider ?? null, model: input.model ?? null })
    .eq("id", assistant.id)
    .eq("session_id", session.session_id);
  if (messageError) throw new Error(`AGI_FALLBACK_MESSAGE_TELEMETRY_FAILED: ${messageError.message}`);

  // Do not overwrite legacy_sync_state here. The database trigger owns the exact invariant
  // and has already set `external_fallback_linked` or aborted the assistant insert.
  return {
    session_id: session.session_id,
    user_message_id: user.id,
    assistant_message_id: assistant.id,
  };
}

export async function loadAgiConversationContext(
  input: LoadAgiConversationContextInput,
): Promise<AgiConversationContext> {
  const client = db();
  const { data: session, error: sessionError } = await client
    .from("agi_sessions")
    .select("id,thread_id,project_id,agi_id,user_id,summary,meta")
    .eq("id", input.session_id)
    .eq("project_id", input.project_id)
    .eq("agi_id", input.agi_id)
    .maybeSingle<{
      id: string;
      thread_id: string;
      project_id: string;
      agi_id: string;
      user_id: string | null;
      summary: string | null;
      meta: JsonRecord;
    }>();

  if (sessionError || !session) {
    throw new Error(`AGI_SESSION_READ_FAILED: ${sessionError?.message ?? "not_found"}`);
  }
  if (input.user_id && session.user_id && input.user_id !== session.user_id) {
    throw new Error("AGI_SESSION_ACCESS_DENIED");
  }

  const limit = Math.max(1, Math.min(input.limit ?? 24, 60));
  const { data: rows, error: messagesError } = await client
    .from("agi_messages")
    .select("id,role,content,created_at")
    .eq("session_id", input.session_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (messagesError) {
    throw new Error(`AGI_MESSAGE_READ_FAILED: ${messagesError.message}`);
  }

  const recent = ((rows ?? []) as Array<AgiConversationMessage>).reverse();
  return {
    session_id: session.id,
    thread_id: session.thread_id,
    project_id: session.project_id,
    agi_id: session.agi_id,
    user_id: session.user_id,
    summary: session.summary,
    recent_messages: recent,
    meta: record(session.meta),
  };
}

export async function updateAgiSessionSummary(input: UpdateAgiSessionSummaryInput): Promise<void> {
  const client = db();
  const { data: existing, error: readError } = await client
    .from("agi_sessions")
    .select("meta")
    .eq("id", input.session_id)
    .eq("project_id", input.project_id)
    .eq("agi_id", input.agi_id)
    .maybeSingle<{ meta: JsonRecord }>();
  if (readError || !existing) {
    throw new Error(`AGI_SESSION_SUMMARY_READ_FAILED: ${readError?.message ?? "not_found"}`);
  }

  const { error } = await client
    .from("agi_sessions")
    .update({
      summary: input.summary.slice(0, 12000),
      meta: { ...record(existing.meta), ...(input.meta_patch ?? {}) },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.session_id)
    .eq("project_id", input.project_id)
    .eq("agi_id", input.agi_id);

  if (error) throw new Error(`AGI_SESSION_SUMMARY_UPDATE_FAILED: ${error.message}`);
}
