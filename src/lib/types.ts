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

// ✅ FIX: normalizador que faltaba
export function normalizeCommandStatus(input?: string): CommandStatus {
  switch ((input ?? "").toLowerCase()) {
    case "queued":
      return "queued";
    case "needs_approval":
      return "needs_approval";
    case "running":
      return "running";
    case "done":
      return "done";
    case "error":
    case "failed":
      return "error";
    case "canceled":
    case "cancelled":
      return "canceled";
    default:
      return "queued";
  }
}

// ==========================
// EVENTS
// ==========================
export type EventLevel = "info" | "warn" | "error";

// ✅ FIX
export function normalizeEventLevel(input?: string): EventLevel {
  switch ((input ?? "").toLowerCase()) {
    case "warn":
    case "warning":
      return "warn";
    case "error":
      return "error";
    default:
      return "info";
  }
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

// ✅ FIX
export function normalizeSupplyOrderStatus(input?: string): SupplyOrderStatus {
  switch ((input ?? "").toLowerCase()) {
    case "paid":
      return "paid";