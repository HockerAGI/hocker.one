export type OwnerLiveAction = {
  id: string;
  title: string;
  status: string;
  risk: "low" | "medium" | "high";
  responsible: string;
  target: string;
  summary: string;
  createdAt: string;
  raw: unknown;
};

export type OwnerEvidenceRecord = {
  id: string;
  title: string;
  result: "success" | "failed" | "rolled_back" | "unknown";
  target: string;
  summary: string;
  createdAt: string;
  rollback: string;
  raw: unknown;
};

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function pickArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const keys = [
    "actions",
    "items",
    "data",
    "results",
    "pending",
    "executed",
    "rows",
    "queue",
  ];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  if (isRecord(payload.data)) return pickArray(payload.data);
  return [];
}

function normalizeRisk(value: unknown): "low" | "medium" | "high" {
  const risk = asString(value, "low").toLowerCase();
  if (["high", "alto", "critical", "crítico", "critico"].includes(risk)) return "high";
  if (["medium", "medio", "moderate"].includes(risk)) return "medium";
  return "low";
}

function humanStatus(status: string): string {
  const clean = status.toLowerCase();

  if (["draft", "prepared"].includes(clean)) return "Preparada";
  if (["pending", "needs_approval", "queued"].includes(clean)) return "Necesita aprobación";
  if (["approved"].includes(clean)) return "Aprobada";
  if (["executing", "running"].includes(clean)) return "Ejecutándose";
  if (["executed", "completed", "success"].includes(clean)) return "Completada";
  if (["failed", "error"].includes(clean)) return "Falló sin afectar el sistema";
  if (["rolled_back", "rollback"].includes(clean)) return "Revertida";

  return status || "En revisión";
}

export function normalizeOwnerActions(payload: unknown): OwnerLiveAction[] {
  return pickArray(payload)
    .filter(isRecord)
    .map((item, index) => {
      const id =
        asString(item.id) ||
        asString(item.action_id) ||
        asString(item.uuid) ||
        `action-${index}`;

      const status = asString(item.status, "pending");
      const tool = asString(item.tool_key || item.tool || item.provider, "NOVA");
      const actionType = asString(item.action_type || item.type || item.operation, "acción");
      const target = asString(item.target || item.repository || item.project_id || item.app, "Hocker ONE");

      const title =
        asString(item.title) ||
        asString(item.name) ||
        `Acción ${actionType}`;

      const summary =
        asString(item.summary) ||
        asString(item.description) ||
        asString(item.approval_note) ||
        "Acción preparada para revisión.";

      return {
        id,
        title,
        status: humanStatus(status),
        risk: normalizeRisk(item.risk || item.risk_level),
        responsible: tool,
        target,
        summary,
        createdAt: asString(item.created_at || item.createdAt || item.executed_at, "Sin fecha"),
        raw: item,
      };
    });
}

export function normalizeOwnerEvidence(payload: unknown): OwnerEvidenceRecord[] {
  return pickArray(payload)
    .filter(isRecord)
    .map((item, index) => {
      const id =
        asString(item.id) ||
        asString(item.action_id) ||
        asString(item.uuid) ||
        `evidence-${index}`;

      const status = asString(item.status, "unknown").toLowerCase();
      const result =
        status.includes("rollback") ? "rolled_back" :
        status.includes("fail") || status.includes("error") ? "failed" :
        status.includes("executed") || status.includes("success") || status.includes("completed") ? "success" :
        "unknown";

      const actionType = asString(item.action_type || item.type || item.operation, "acción");
      const target = asString(item.target || item.repository || item.project_id || item.app, "Hocker ONE");

      const executionResult = isRecord(item.execution_result)
        ? item.execution_result
        : null;

      const title =
        asString(item.title) ||
        `Evidencia de ${actionType}`;

      const summary =
        asString(item.summary) ||
        asString(item.execution_error) ||
        asString(executionResult?.worker) ||
        "Resultado registrado para revisión.";

      const rollback = item.rollback_plan ? "Disponible" : "No registrado";

      return {
        id,
        title,
        result,
        target,
        summary,
        createdAt: asString(item.executed_at || item.created_at || item.createdAt, "Sin fecha"),
        rollback,
        raw: item,
      };
    });
}
