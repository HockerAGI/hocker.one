export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

export type ProjectId = "hocker-one";
export type NodeId = "hocker-agi";

export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled";

export type CommandName =
  | "ping"
  | "node.sync"
  | "system.echo"
  | "supply.create_order"
  | "node.activate"
  | "node.deactivate"
  | "restart_db"
  | "restart_nova"
  | "restart_telemetry";

export type EventLevel = "info" | "warn" | "error";

export type NodeStatus =
  | "offline"
  | "online"
  | "idle"
  | "busy"
  | "warning"
  | "error";

export interface CommandRow {
  id: string;
  project_id: ProjectId;
  node_id: NodeId;
  command: CommandName;
  payload: JsonObject;
  status: CommandStatus;
  needs_approval: boolean;
  signature: string;
  result: JsonObject | null;
  error: string | null;
  created_at: string;
  executed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  approved_at: string | null;
}

export interface NodeRow {
  id: NodeId;
  project_id: ProjectId;
  name: string | null;
  type: string;
  status: NodeStatus;
  last_seen_at: string | null;
  meta: JsonObject;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: ProjectId;
  name: string | null;
  meta: JsonObject;
  created_at: string;
}