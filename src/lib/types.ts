/**
 * JERARQUÍA DE AUTORIDAD HOCKER
 * Define los niveles de acceso y soberanía dentro del búnker digital.
 */
export type Role = "owner" | "admin" | "operator" | "viewer";

/**
 * CICLO DE VIDA DE COMANDOS
 * Se soportan ambos términos para compatibilidad, pero el canónico operativo es "cancelled".
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

/**
 * ESTADO DE NODOS OPERATIVOS
 */
export type NodeStatus = "online" | "offline" | "degraded";

/**
 * ESTRUCTURA DE COMANDO (CommandRow)
 * Representa una orden táctica inyectada en la cola de ejecución.
 */
export type CommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: Record<string, unknown>; // Purga de 'any'
  status: CommandStatus;
  needs_approval: boolean;
  signature: string;
  result: Record<string, unknown> | null; // Purga de 'any'
  error: string | null;
  approved_at: string | null;
  executed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

/**
 * BITÁCORA DE EVENTOS (EventRow)
 * Registro persistente de la telemetría y movimientos de la Matriz.
 */
export type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: "info" | "warn" | "error" | "critical";
  type: string;
  message: string;
  data: Record<string, unknown>; // Purga de 'any'
  created_at: string;
};

/**
 * REGISTRO DE NODOS (NodeRow)
 * Activos de hardware o instancias de nube en el Automation Fabric.
 */
export type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: "cloud" | "agent";
  status: NodeStatus;
  last_seen_at: string | null;
  tags: string[];
  meta: Record<string, unknown>; // Purga de 'any'
  created_at: string;
  updated_at: string;
};

/**
 * PROTOCOLOS DE GOBERNANZA (ControlRow)
 * Interruptores maestros de soberanía y emergencia.
 */
export type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: Record<string, unknown>; // Purga de 'any'
  created_at: string;
  updated_at: string;
};

/**
 * FLUJO LOGÍSTICO (Supply)
 */
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
  meta: Record<string, unknown>; // Purga de 'any'
  created_at: string;
  updated_at: string;
};

/**
 * NORMALIZADORES TÁCTICOS
 * Aseguran que el lenguaje entre componentes sea coherente y sin errores de sintaxis.
 */
export function normalizeCommandStatus(status: string | null | undefined): CommandStatus {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "canceled" || s === "cancelled") return "cancelled";
  
  const valid: CommandStatus[] = ["queued", "needs_approval", "running", "done", "error", "failed"];
  return valid.includes(s as CommandStatus) ? (s as CommandStatus) : "queued";
}

export function normalizeSupplyOrderStatus(status: string | null | undefined): SupplyOrderStatus {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "canceled" || s === "cancelled") return "cancelled";
  
  const valid: SupplyOrderStatus[] = ["pending", "paid", "producing", "shipped", "delivered"];
  return valid.includes(s as SupplyOrderStatus) ? (s as SupplyOrderStatus) : "pending";
}
