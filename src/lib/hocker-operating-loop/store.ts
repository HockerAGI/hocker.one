import type { SupabaseClient } from "@supabase/supabase-js";
import { assertValidWorkSessionTransition } from "./state";
import type { WorkSessionEnvelope, WorkSessionState } from "./types";

type JsonRecord = Record<string, unknown>;

type WorkSessionRow = {
  id: string;
  project_id: string;
  thread_id: string | null;
  mission_id: string | null;
  state: WorkSessionState;
  candidate_id: string | null;
  run_id: string | null;
  task_id: string | null;
  action_id: string | null;
  evidence_id: string | null;
  idempotency_key: string | null;
  version: number;
  meta: JsonRecord;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type WorkSessionEventRow = {
  id: string;
  work_session_id: string;
  project_id: string;
  sequence: number;
  event_type: string;
  from_state: WorkSessionState | null;
  to_state: WorkSessionState | null;
  actor_user_id: string | null;
  idempotency_key: string | null;
  meta: JsonRecord;
  created_at: string;
};

function toEnvelope(row: WorkSessionRow): WorkSessionEnvelope {
  return {
    work_session_id: row.id,
    project_id: row.project_id,
    thread_id: row.thread_id,
    mission_id: row.mission_id,
    state: row.state,
    candidate_id: row.candidate_id,
    run_id: row.run_id,
    task_id: row.task_id,
    action_id: row.action_id,
    evidence_id: row.evidence_id,
    updated_at: row.updated_at,
  };
}

const selectColumns = "id,project_id,thread_id,mission_id,state,candidate_id,run_id,task_id,action_id,evidence_id,idempotency_key,version,meta,created_by,created_at,updated_at";

export async function getWorkSession(
  sb: SupabaseClient,
  projectId: string,
  workSessionId: string,
): Promise<WorkSessionEnvelope | null> {
  const { data, error } = await sb
    .from("hocker_work_sessions")
    .select(selectColumns)
    .eq("project_id", projectId)
    .eq("id", workSessionId)
    .maybeSingle<WorkSessionRow>();

  if (error) throw new Error(`WORK_SESSION_READ_FAILED:${error.message}`);
  return data ? toEnvelope(data) : null;
}

export async function createWorkSession(
  sb: SupabaseClient,
  input: {
    project_id: string;
    created_by: string | null;
    thread_id?: string | null;
    mission_id?: string | null;
    idempotency_key?: string | null;
    meta?: JsonRecord;
  },
): Promise<WorkSessionEnvelope> {
  const row = {
    project_id: input.project_id,
    thread_id: input.thread_id ?? null,
    mission_id: input.mission_id ?? null,
    state: "planning" as const,
    idempotency_key: input.idempotency_key ?? null,
    meta: input.meta ?? {},
    created_by: input.created_by,
  };

  const { data, error } = await sb
    .from("hocker_work_sessions")
    .insert(row)
    .select(selectColumns)
    .single<WorkSessionRow>();

  if (error) {
    if (input.idempotency_key) {
      const existing = await getByIdempotency(sb, input.project_id, input.idempotency_key);
      if (existing) return existing;
    }
    throw new Error(`WORK_SESSION_CREATE_FAILED:${error.message}`);
  }

  const { error: eventError } = await sb.from("hocker_work_session_events").insert({
    work_session_id: data.id,
    project_id: input.project_id,
    sequence: 0,
    event_type: "created",
    from_state: null,
    to_state: "planning",
    actor_user_id: input.created_by,
    idempotency_key: input.idempotency_key ? `${input.idempotency_key}:created` : null,
    meta: {},
  });

  if (eventError) {
    await sb.from("hocker_work_sessions").delete().eq("id", data.id).eq("project_id", input.project_id);
    throw new Error(`WORK_SESSION_EVENT_CREATE_FAILED:${eventError.message}`);
  }

  return toEnvelope(data);
}

export async function transitionWorkSession(
  sb: SupabaseClient,
  input: {
    project_id: string;
    work_session_id: string;
    to_state: WorkSessionState;
    actor_user_id: string | null;
    event_type?: string;
    idempotency_key?: string | null;
    meta?: JsonRecord;
  },
): Promise<WorkSessionEnvelope> {
  const { data: current, error: readError } = await sb
    .from("hocker_work_sessions")
    .select(selectColumns)
    .eq("project_id", input.project_id)
    .eq("id", input.work_session_id)
    .maybeSingle<WorkSessionRow>();

  if (readError) throw new Error(`WORK_SESSION_READ_FAILED:${readError.message}`);
  if (!current) throw new Error("WORK_SESSION_NOT_FOUND");

  if (input.idempotency_key) {
    const { data: existingEvent } = await sb
      .from("hocker_work_session_events")
      .select("work_session_id")
      .eq("work_session_id", current.id)
      .eq("idempotency_key", input.idempotency_key)
      .maybeSingle<{ work_session_id: string }>();
    if (existingEvent) return toEnvelope(current);
  }

  assertValidWorkSessionTransition(current.state, input.to_state);

  const nextVersion = current.version + 1;
  const { data: updated, error: updateError } = await sb
    .from("hocker_work_sessions")
    .update({ state: input.to_state, version: nextVersion })
    .eq("project_id", input.project_id)
    .eq("id", current.id)
    .eq("version", current.version)
    .select(selectColumns)
    .maybeSingle<WorkSessionRow>();

  if (updateError) throw new Error(`WORK_SESSION_UPDATE_FAILED:${updateError.message}`);
  if (!updated) throw new Error("WORK_SESSION_CONFLICT");

  const { error: eventError } = await sb.from("hocker_work_session_events").insert({
    work_session_id: current.id,
    project_id: input.project_id,
    sequence: nextVersion,
    event_type: input.event_type ?? "state_changed",
    from_state: current.state,
    to_state: input.to_state,
    actor_user_id: input.actor_user_id,
    idempotency_key: input.idempotency_key ?? null,
    meta: input.meta ?? {},
  });

  if (eventError) {
    await sb.from("hocker_work_sessions")
      .update({ state: current.state, version: current.version })
      .eq("project_id", input.project_id)
      .eq("id", current.id)
      .eq("version", nextVersion);
    throw new Error(`WORK_SESSION_EVENT_CREATE_FAILED:${eventError.message}`);
  }

  return toEnvelope(updated);
}

async function getByIdempotency(
  sb: SupabaseClient,
  projectId: string,
  idempotencyKey: string,
): Promise<WorkSessionEnvelope | null> {
  const { data, error } = await sb
    .from("hocker_work_sessions")
    .select(selectColumns)
    .eq("project_id", projectId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<WorkSessionRow>();
  if (error) throw new Error(`WORK_SESSION_IDEMPOTENCY_LOOKUP_FAILED:${error.message}`);
  return data ? toEnvelope(data) : null;
}

export async function listWorkSessionEvents(
  sb: SupabaseClient,
  projectId: string,
  workSessionId: string,
): Promise<WorkSessionEventRow[]> {
  const { data, error } = await sb
    .from("hocker_work_session_events")
    .select("id,work_session_id,project_id,sequence,event_type,from_state,to_state,actor_user_id,idempotency_key,meta,created_at")
    .eq("project_id", projectId)
    .eq("work_session_id", workSessionId)
    .order("sequence", { ascending: true });
  if (error) throw new Error(`WORK_SESSION_EVENTS_READ_FAILED:${error.message}`);
  return (data ?? []) as WorkSessionEventRow[];
}
