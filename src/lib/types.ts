/**
 * JERARQUÍA DE AUTORIDAD HOCKER
 */
export type Role = "owner" | "admin" | "operator" | "viewer";

/**
 * CICLO DE VIDA DE COMANDOS
 */
export type CommandStatus =
  | "queued"          // En espera en la cola
  | "needs_approval"  // Retenido por el Escudo de Seguridad
  | "running"         // Siendo procesado por un nodo
  | "done"            // Ejecutado con éxito
  | "error"           // Fallo de ejecución en el nodo
  | "canceled";       // Abortado manualmente por el Director

export type NodeStatus = "online" | "offline" | "degraded";

/**
 * REGISTROS DE COMANDOS
 */
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

/**
 * REGISTROS DE MEMORIA (RADAR)
 */
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

/**
 * INFRAESTRUCTURA DE NODOS
 */
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

/**
 * ESCUDO DE GOBERNANZA
 */
export type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: any;
  created_at: string;
  updated_at: string;
};

/**
 * LOGÍSTICA (HKR SUPPLY)
 */
export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
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
