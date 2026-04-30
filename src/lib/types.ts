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
export type ProjectId = string;
export type NodeId = string;

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
  | "status"
  | "read_dir"
  | "read_file_head"
  | "shell.exec"
  | "fs.write"
  | "run_sql"
  | "stripe.charge"
  | "meta.send_msg"
  | "node.sync"
  | "system.echo"
  | "supply.create_order"
  | "node.activate"
  | "node.deactivate"
  | "restart_db"
  | "restart_nova"
  | "restart_telemetry"
  | "github.get_repo"
  | "github.list_tree"
  | "github.read_file"
  | "github.create_branch"
  | "github.upsert_file"
  | "github.create_pr";

// ==========================
// EVENTS
// ==========================
export type EventLevel = "info" | "warn" | "error";

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
  | "canceled"
  | "cancelled";

// ==========================
// ROLES
// ==========================
export type Role = "owner" | "admin" | "operator" | "viewer";

// ==========================
// AUDIT
// ==========================
export type AuditActorType = "user" | "nova" | "system" | "worker";
export type AuditSeverity = "info" | "warn" | "error" | "critical";

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

export interface ControlRow {
  project_id: ProjectId;
  id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  project_id: ProjectId;
  node_id: NodeId | null;
  type: string;
  message: string;
  level: EventLevel;
  data: JsonObject | null;
  created_at: string;
}

export interface SupplyProductRow {
  id: string;
  project_id: ProjectId;
  name: string;
  sku: string | null;
  description: string | null;
  price_cents: number;
  currency: string;
  active: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
}

export interface SupplyOrderRow {
  id: string;
  project_id: ProjectId;
  status: SupplyOrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
}

export interface SupplyOrderItemRow {
  id: string;
  project_id: ProjectId;
  order_id: string;
  product_id: string | null;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
}

export interface AuditChainRow {
  id: string;
  project_id: ProjectId;
  seq: number;
  prev_hash: string;
  row_hash: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: AuditActorType;
  actor_id: string | null;
  role: string;
  action: string;
  severity: AuditSeverity;
  payload: JsonObject;
  created_at: string;
  signature: string;
}

// ==========================
// FUNCIONES DE NORMALIZACIÓN
// ==========================

export function normalizeCommandStatus(status: string | null | undefined): CommandStatus {
  if (!status) return "queued";
  const s = status.toLowerCase();
  if (["queued", "needs_approval", "running", "done", "error", "canceled"].includes(s)) {
    return s as CommandStatus;
  }
  return "queued";
}

export function normalizeEventLevel(level: string | null | undefined): EventLevel {
  if (!level) return "info";
  const l = level.toLowerCase();
  if (["info", "warn", "error"].includes(l)) {
    return l as EventLevel;
  }
  return "info";
}

export function normalizeSupplyOrderStatus(status: string | null | undefined): SupplyOrderStatus {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (["pending", "paid", "producing", "shipped", "delivered", "canceled", "cancelled"].includes(s)) {
    return s as SupplyOrderStatus;
  }
  return "pending";
}