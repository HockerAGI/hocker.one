export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Role = "owner" | "admin" | "operator" | "viewer";

export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled";

export type EventLevel = "info" | "warn" | "error";

export type NodeStatus = "online" | "offline" | "degraded";

export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
  | "canceled";

export type AgiRow = {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: JsonObject | null;
  created_at: string;
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

export type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  data: JsonObject | null;
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
  meta: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject | null;
  created_at: string;
  updated_at: string;
};

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
  meta: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type SupplyOrderRow = {
  id: string;
  project_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  status: SupplyOrderStatus;
  meta: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type SupplyOrderItemRow = {
  id: string;
  project_id: string;
  order_id: string;
  product_id: string | null;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
  created_at: string;
};

function normalizeAlias(value: string): string {
  if (value === "canceled") return "canceled";
  if (value === "cancelled") return "canceled";
  if (value === "failed") return "error";
  if (value === "critical") return "error";
  if (value === "warning") return "warn";
  return value;
}

export function normalizeCommandStatus(
  status: string | null | undefined,
): CommandStatus {
  const s = normalizeAlias(String(status ?? "").toLowerCase().trim());
  if (!s) return "queued";

  if (
    s === "queued" ||
    s === "needs_approval" ||
    s === "running" ||
    s === "done" ||
    s === "error" ||
    s === "canceled"
  ) {
    return s;
  }

  return "queued";
}

export function normalizeEventLevel(
  level: string | null | undefined,
): EventLevel {
  const s = normalizeAlias(String(level ?? "").toLowerCase().trim());
  if (s === "warn") return "warn";
  if (s === "error") return "error";
  return "info";
}

export function normalizeSupplyOrderStatus(
  status: string | null | undefined,
): SupplyOrderStatus {
  const s = normalizeAlias(String(status ?? "").toLowerCase().trim());
  if (!s) return "pending";

  if (
    s === "pending" ||
    s === "paid" ||
    s === "producing" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "canceled"
  ) {
    return s;
  }

  return "pending";
}