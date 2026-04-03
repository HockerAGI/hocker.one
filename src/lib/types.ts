export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Role = "owner" | "admin" | "operator" | "viewer";

export type CommandStatus =
  | "needs_approval"
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "cancelled";

export type NodeStatus = "online" | "offline" | "degraded";

export type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
};

export type CommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: JsonObject;
  status: CommandStatus;
  needs_approval: boolean;
  signature: string | null;
  result: JsonObject | null;
  error: string | null;
  approved_at: string | null;
  executed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type EventLevel = "info" | "warn" | "error" | "critical";

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

export type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: "cloud" | "agent";
  status: NodeStatus;
  last_seen_at: string | null;
  tags: string[];
  meta: JsonObject;
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

export type SupplyProductRow = {
  id: string;
  project_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  cost_cents: number;
  currency: string;
  stock: number;
  active: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
};

function normalizeAlias(status: string): string {
  if (status === "canceled") return "cancelled";
  return status;
}

export function normalizeCommandStatus(status: string | null | undefined): CommandStatus {
  const s = normalizeAlias(String(status ?? "").toLowerCase().trim());
  if (!s) return "queued";

  if (
    s === "needs_approval" ||
    s === "queued" ||
    s === "running" ||
    s === "done" ||
    s === "failed" ||
    s === "cancelled"
  ) {
    return s;
  }

  return "queued";
}

export function normalizeEventLevel(level: string | null | undefined): EventLevel {
  const s = String(level ?? "").toLowerCase().trim();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error") return "error";
  if (s === "critical") return "critical";
  return "info";
}

export function normalizeSupplyOrderStatus(status: string | null | undefined): SupplyOrderStatus {
  const s = normalizeAlias(String(status ?? "").toLowerCase().trim());
  if (!s) return "pending";

  if (
    s === "pending" ||
    s === "paid" ||
    s === "producing" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "cancelled"
  ) {
    return s;
  }

  return "pending";
}