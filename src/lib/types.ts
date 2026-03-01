export type ProjectRole = "owner" | "admin" | "operator" | "viewer";
export type Role = ProjectRole;

/**
 * Para evitar crashes:
 * - Nuevo estándar: error / canceled
 * - Compat legado: failed / cancelled
 */
export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled"
  | "failed"
  | "cancelled";

export type NodeStatus = "online" | "offline" | "degraded";

export type CommandRow = {
  id: string;
  project_id: string;
  created_at: string;
  created_by: string | null;
  status: CommandStatus;
  needs_approval: boolean;
  approved_at: string | null;
  approved_by: string | null;
  executed_at: string | null;
  executed_by: string | null;
  finished_at: string | null;
  command: string;
  payload: any;
  signature: string | null;
  result: any | null;
  error: string | null;
};

export type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  created_at: string;
  level: "info" | "warn" | "error";
  type: string;
  message: string;
  data: any;
};

export type NodeRow = {
  id: string;
  project_id: string;
  created_at: string;
  last_seen_at: string | null;
  status: NodeStatus;
  meta: any;
  name?: string | null;
  type?: string | null;
  tags?: string[] | null;
};

export type ControlRow = {
  id: string;
  project_id: string;
  updated_at: string;
  kill_switch: boolean;
  allow_write: boolean;
  notes: string | null;
};