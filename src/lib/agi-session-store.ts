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
  sync_legacy_nova?: boolean;
};

export type AppendAgiMessageInput = {
  session_id: string;
  project_id: string;
  agi_id: string;
  role: AgiConversationMessage["role"];
  content: string;
  trace_id?: string | null;
  provider?: string | null;
  model?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  meta?: JsonRecord;
  sync_legacy_nova?: boolean;
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
      p_sync_legacy_nova: Boolean(input.sync_legacy_nova),
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
): Promise<{ id: string; legacy_message_id: string | null; usage_id: string | null }> {
  const { data, error } = await rpcDb().rpc<
    Array<{ message_id: string; legacy_message_id: string | null; usage_id: string | null }>
  >("append_agi_message", {
    p_session_id: input.session_id,
    p_project_id: input.project_id,
    p_agi_id: input.agi_id,
    p_role: input.role,
    p_content: input.content,
    p_trace_id: input.trace_id ?? null,
    p_provider: input.provider ?? null,
    p_model: input.model ?? null,
    p_tokens_in: input.tokens_in ?? null,
    p_tokens_out: input.tokens_out ?? null,
    p_meta: input.meta ?? {},
    p_sync_legacy_nova: Boolean(input.sync_legacy_nova),
  });

  const row = data?.[0];
  if (error || !row?.message_id) {
    throw new Error(`AGI_MESSAGE_APPEND_FAILED: ${error?.message ?? "empty_result"}`);
  }
  return {
    id: row.message_id,
    legacy_message_id: row.legacy_message_id ?? null,
    usage_id: row.usage_id ?? null,
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
