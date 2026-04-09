export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Role = "owner" | "admin" | "operator" | "viewer" | "member";

export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled";

export function normalizeCommandStatus(
  value: string | null | undefined,
): CommandStatus {
  const s = String(value ?? "").toLowerCase().trim();

  if (s === "needs_approval" || s === "approval" || s === "pending") return "needs_approval";
  if (s === "running" || s === "processing" || s === "in_progress") return "running";
  if (s === "done" || s === "success" || s === "completed") return "done";
  if (s === "error" || s === "failed") return "error";
  if (s === "canceled" || s === "cancelled") return "canceled";

  return "queued";
}

export type EventLevel = "info" | "warn" | "error";

export type NodeStatus = "online" | "degraded" | "offline";

export type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  updated_at?: string | null;
  created_at?: string | null;
};

export type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type?: string | null;
  status: NodeStatus;
  last_seen_at: string | null;
  tags: string[];
  meta: JsonObject;
  created_at: string;
  updated_at: string;
};

export type CommandRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  command: string;
  payload: JsonObject;
  status: CommandStatus;
  needs_approval: boolean;
  signature?: string | null;
  result?: JsonObject | null;
  error?: string | null;
  approved_at?: string | null;
  executed_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  data: JsonObject;
  created_at: string;
};

export type AgiRow = {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: JsonObject;
  created_at: string;
};