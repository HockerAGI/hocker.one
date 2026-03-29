/**
 * JERARQUÍA DE AUTORIDAD HOCKER
 */
export type Role = "owner" | "admin" | "operator" | "viewer";

/**
 * CICLO DE VIDA DE COMANDOS
 * Se soportan ambos spellings para compatibilidad, pero el canónico es "cancelled".
 */
export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "failed"
  | "cancelled"
  | "canceled";

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
  level: "info" | "warn" | "error" | "critical";
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
  tags: string[];
  meta: any;
  created_at: string;
  updated_at: string;
};

export type ControlRow = {
  id: string;
  project_id: string;
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
  | "cancelled"
  | "canceled";

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
  meta: any;
  created_at: string;
  updated_at: string;
};

export function normalizeCommandStatus(status: string | null | undefined): CommandStatus {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "canceled") return "cancelled";
  if (s === "cancelled") return "cancelled";
  if (
    s === "queued" ||
    s === "needs_approval" ||
    s === "running" ||
    s === "done" ||
    s === "error" ||
    s === "failed"
  ) {
    return s;
  }
  return "queued";
}

export function normalizeSupplyOrderStatus(status: string | null | undefined): SupplyOrderStatus {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "canceled") return "cancelled";
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