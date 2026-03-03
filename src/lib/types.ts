export type ProjectRole = "owner" | "admin" | "operator" | "viewer";
export type Role = ProjectRole;

export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled"
  // compat por si ya se coló data vieja
  | "cancelled"
  | "failed";

export type NodeStatus = "online" | "offline" | "degraded";

export type CommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: any;

  status: CommandStatus;
  needs_approval: boolean;
  signature: string;

  result: any | null;
  error: string | null;

  created_at: string;
  approved_at: string | null;
  started_at: string | null;
  executed_at: string | null;
  finished_at: string | null;
};

export type EventLevel = "info" | "warn" | "error";

export type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  data: any;
  created_at: string;
};

export type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: string;
  status: NodeStatus;
  last_seen_at: string | null;
  meta: any;
  created_at: string;
  updated_at: string;
};

export type ControlRow = {
  project_id: string;
  id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: any;
  created_at: string;
  updated_at: string;
};

export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
  | "cancelled";