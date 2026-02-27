export type ProjectRole = "owner" | "admin" | "operator" | "viewer";

export type CommandStatus =
  | "queued"
  | "needs_approval"
  | "running"
  | "done"
  | "error"
  | "canceled";

export type NodeStatus = "online" | "offline" | "degraded";

export type CommandRow = {
  id: string;
  project_id: string;
  created_at: string;
  created_by: string | null;
  status: CommandStatus;
  needs_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  executed_by: string | null;
  executed_at: string | null;
  finished_at: string | null;
  command: string;
  payload: any;
  signature: string;
  error: string | null;
};

export type EventRow = {
  id: string;
  project_id: string;
  created_at: string;
  actor_type: "user" | "node" | "system";
  actor_id: string | null;
  type: string;
  data: any;
};

export type NodeRow = {
  id: string;
  project_id: string;
  created_at: string;
  last_seen_at: string | null;
  status: NodeStatus;
  meta: any;
};

export type ControlRow = {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  kill_switch: boolean;
  allow_write: boolean;
  notes: string | null;
};

export type SupplyProductRow = {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  sku: string | null;
  meta: any;
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
  order_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
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
  created_at: string;
  updated_at: string;
  status: SupplyOrderStatus;
  customer_name: string;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  meta: any;
  items?: SupplyOrderItemRow[];
};
