import type { SupabaseClient } from "@supabase/supabase-js";
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
  const { data, error } = await sb.rpc("hocker_create_work_session", {
    p_project_id: input.project_id,
    p_created_by: input.created_by,
    p_thread_id: input.thread_id ?? null,
    p_mission_id: input.mission_id ?? null,
    p_idempotency_key: input.idempotency_key ?? null,
    p_meta: input.meta ?? {},
  });

  if (error) throw new Error(`WORK_SESSION_CREATE_FAILED:${error.message}`);
  if (!data) throw new Error("WORK_SESSION_CREATE_FAILED:NO_RESULT");
  return toEnvelope(data as WorkSessionRow);
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
  const { data, error } = await sb.rpc("hocker_transition_work_session", {
    p_project_id: input.project_id,
    p_work_session_id: input.work_session_id,
    p_to_state: input.to_state,
    p_actor_user_id: input.actor_user_id,
    p_event_type: input.event_type ?? "state_changed",
    p_idempotency_key: input.idempotency_key ?? null,
    p_meta: input.meta ?? {},
  });

  if (error) {
    if (error.message.includes("WORK_SESSION_NOT_FOUND")) {
      throw new Error("WORK_SESSION_NOT_FOUND");
    }
    if (error.message.includes("WORK_SESSION_CONFLICT")) {
      throw new Error("WORK_SESSION_CONFLICT");
    }
    throw new Error(`WORK_SESSION_TRANSITION_FAILED:${error.message}`);
  }
  if (!data) throw new Error("WORK_SESSION_TRANSITION_FAILED:NO_RESULT");
  return toEnvelope(data as WorkSessionRow);
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
