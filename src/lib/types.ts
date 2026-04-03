export type SupplyOrderStatus =
  | "pending"
  | "paid"
  | "producing"
  | "shipped"
  | "delivered"
  | "canceled";

function normalizeCommandAlias(status: string): string {
  if (status === "canceled") return "cancelled";
  return status;
}

function normalizeSupplyOrderAlias(status: string): string {
  if (status === "cancelled") return "canceled";
  return status;
}

export function normalizeCommandStatus(
  status: string | null | undefined,
): CommandStatus {
  const s = normalizeCommandAlias(
    String(status ?? "").toLowerCase().trim(),
  );

  if (!s) return "queued";

  if (
    s === "needs_approval" ||
    s === "queued" ||
    s === "running" ||
    s === "done" ||
    s === "failed" ||
    s === "cancelled"
  ) {
    return s as CommandStatus;
  }

  return "queued";
}

export function normalizeEventLevel(
  level: string | null | undefined,
): EventLevel {
  const s = String(level ?? "").toLowerCase().trim();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error") return "error";
  if (s === "critical") return "critical";
  return "info";
}

export function normalizeSupplyOrderStatus(
  status: string | null | undefined,
): SupplyOrderStatus {
  const s = normalizeSupplyOrderAlias(
    String(status ?? "").toLowerCase().trim(),
  );

  if (!s) return "pending";

  if (
    s === "pending" ||
    s === "paid" ||
    s === "producing" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "canceled"
  ) {
    return s as SupplyOrderStatus;
  }

  return "pending";
}