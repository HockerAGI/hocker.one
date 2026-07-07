/**
 * Hocker ONE — Operational Alerts
 *
 * PR-06: Alert system for critical events in the control plane.
 * Currently logs to structured logger; can be extended to send
 * notifications via email, Slack, or webhook.
 */

import { log, type LogContext } from "@/lib/logger";

export type AlertSeverity = "warn" | "error" | "critical";
export type AlertCategory = "health" | "security" | "queue" | "owner_gate" | "mcp" | "system";

export type AlertPayload = {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: LogContext;
};

const alertHistory: AlertPayload[] = [];
const MAX_HISTORY = 100;

function addAlert(payload: AlertPayload): void {
  alertHistory.push(payload);
  if (alertHistory.length > MAX_HISTORY) {
    alertHistory.shift();
  }
}

export function emitAlert(payload: AlertPayload): void {
  addAlert(payload);

  switch (payload.severity) {
    case "critical":
      log.fatal(`[ALERT][${payload.category}] ${payload.title}: ${payload.message}`, payload.context);
      break;
    case "error":
      log.error(`[ALERT][${payload.category}] ${payload.title}: ${payload.message}`, payload.context);
      break;
    case "warn":
    default:
      log.warn(`[ALERT][${payload.category}] ${payload.title}: ${payload.message}`, payload.context);
      break;
  }
}

export function getAlertHistory(limit = 20): AlertPayload[] {
  return alertHistory.slice(-limit);
}

export function alertHealthDegraded(service: string, reason: string, ctx?: LogContext) {
  emitAlert({ category: "health", severity: "error", title: "Service Degraded", message: `${service}: ${reason}`, context: ctx });
}

export function alertSecurityEvent(reason: string, ctx?: LogContext) {
  emitAlert({ category: "security", severity: "critical", title: "Security Event", message: reason, context: ctx });
}

export function alertQueueStuck(projectId: string, reason: string, ctx?: LogContext) {
  emitAlert({ category: "queue", severity: "warn", title: "Queue Stuck", message: `Project ${projectId}: ${reason}`, context: ctx });
}

export function alertOwnerGateFailure(reason: string, ctx?: LogContext) {
  emitAlert({ category: "owner_gate", severity: "error", title: "Owner Gate Failure", message: reason, context: ctx });
}

export function alertMcpProviderDown(provider: string, reason: string, ctx?: LogContext) {
  emitAlert({ category: "mcp", severity: "warn", title: "MCP Provider Down", message: `${provider}: ${reason}`, context: ctx });
}
