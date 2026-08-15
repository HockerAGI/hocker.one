const SUCCESS_STATUSES = new Set(["executed", "completed", "done", "success", "succeeded"]);
const CANCELLED_STATUSES = new Set(["rejected", "cancelled", "canceled"]);
const FAILED_STATUSES = new Set(["failed", "error", "execution_failed", "needs_fix"]);

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function percentComplete(completed, total) {
  const safeTotal = Math.max(0, finiteNumber(total));
  if (safeTotal === 0) return 0;
  const safeCompleted = Math.min(safeTotal, Math.max(0, finiteNumber(completed)));
  return Math.max(0, Math.min(100, Math.round((safeCompleted / safeTotal) * 100)));
}

export function evidenceCompletion(gates) {
  const list = Array.isArray(gates) ? gates : [];
  return percentComplete(list.filter(Boolean).length, list.length);
}

export function averageCompletion(values) {
  const list = (Array.isArray(values) ? values : [])
    .map(finiteNumber)
    .map((value) => Math.max(0, Math.min(100, value)));
  if (list.length === 0) return 0;
  return Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
}

export function providerReadiness(input = {}) {
  const configured = input.configured === true;
  const connected = input.connected === true;
  const lastError = String(input.lastError ?? "").trim();

  if (connected) return { key: "connected", label: "Conectado", percent: 100 };
  if (configured && lastError) return { key: "degraded", label: "Con problemas", percent: 50 };
  if (configured) return { key: "configured", label: "Configurado", percent: 50 };
  return { key: "pending", label: "Pendiente", percent: 0 };
}

export function guidedGithubChainOutcome(statuses, total) {
  const list = (Array.isArray(statuses) ? statuses : []).map((status) => String(status ?? "").toLowerCase());
  const requiredTotal = Math.max(0, finiteNumber(total));

  if (list.some((status) => FAILED_STATUSES.has(status))) return "failed";

  const successful = list.filter((status) => SUCCESS_STATUSES.has(status)).length;
  if (requiredTotal > 0 && successful >= requiredTotal) return "completed";

  const terminal = list.filter((status) => SUCCESS_STATUSES.has(status) || CANCELLED_STATUSES.has(status)).length;
  const hasCancelled = list.some((status) => CANCELLED_STATUSES.has(status));
  if (requiredTotal > 0 && hasCancelled && list.length >= requiredTotal && terminal >= requiredTotal) return "cancelled";

  return "in_progress";
}

export function operationalAgiProgress(input = {}) {
  return evidenceCompletion([
    input.profileRegistered === true,
    input.hasHistoricalEvidence === true,
    input.hasRecentEvidence === true,
    input.healthyNow === true,
  ]);
}

export function operationalAppProgress(input = {}) {
  return evidenceCompletion([
    input.exists === true,
    input.hasProductBoundary === true,
    input.hasRuntimeEvidence === true,
    input.verifiedNow === true,
  ]);
}
