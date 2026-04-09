// ==========================
// JSON BASE
// ==========================
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

// ==========================
// CORE
// ==========================
export type ProjectId = "hocker-one";
export type NodeId = "hocker-agi";

// ==========================
// COMMANDS
// ==========================
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

export function normalizeCommandStatus(input?: string): CommandStatus {
  const value = (input ?? "").toLowerCase();

  if (value === "queued") return "queued";
  if (value === "needs_approval") return "needs_approval";
  if (value === "running") return "running";
  if (value === "done") return "done";
  if (value === "error" || value === "failed") return "error";
  if (value === "canceled" || value === "cancelled") return "canceled";

  return "queued";
}

// ==========================
// EVENTS
// ==========================
export type EventLevel = "info" | "warn" | "error";

export function normalizeEventLevel(input?: string): EventLevel {
  const value = (input ?? "").toLowerCase();

  if (value === "warn" || value === "warning") return "warn";
  if (value === "error") return "error";

  return "info";
}

// ==========================
// NODES
// ==========================
export type NodeStatus =
  | "offline"
  | "online"
  | "idle"
  | "busy"
  | "warning"
  | "error";

// ==========================
// SUPPLY
// ==========================
export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
  | "canceled";

export function normalizeSupplyOrderStatus(input?: string): SupplyOrderStatus {
  const value = (input ?? "").toLowerCase();

  if (value === "paid") return "paid";
  if (value === "producing") return "producing";
  if (value === "shipped") return "shipped";
  if (value === "delivered") return "delivered";
  if (value === "canceled" || value === "cancelled") return "canceled";

  return "pending";
}

// ==========================
// DATABASE ROWS
// ==========================
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

export interface AgiRow {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: JsonObject | null;
  created_at: string;
}

// ==========================
// ROLES
// ==========================
export type Role = "owner" | "admin" | "operator" | "viewer";

// ==========================
// SYSTEM CONTROLS
// ==========================
export interface ControlRow {
  project_id: ProjectId;
  id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
}