export type ProjectRole = "owner" | "admin" | "operator" | "viewer";

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
  level: "info" | "warn" | "error" | "warning" | "critical";
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

export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
  | "cancelled";

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
  product?: {
    id: string;
    name: string;
    sku: string | null;
    price_cents: number;
    currency: string;
  } | null;
};

export type SupplyOrderRow = {
  id: string;
  project_id: string;
  status: SupplyOrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  meta: any;
  created_at: string;
  updated_at: string;
  items?: SupplyOrderItemRow[];
};export type Role = ProjectRole;
