export const CHIDO_APPROVAL_LAYER_VERSION = "chido-approval-layer-v0.1.0";
export const CHIDO_APPROVAL_TTL_HOURS = 24;

export type ChidoApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export const CHIDO_APPROVAL_EVENTS = {
  request: "chido.action.approval_request",
  decision: "chido.action.approval_decision",
} as const;

export type ChidoApprovalRequestData = {
  approval_request_id: string;
  action_id: string;
  action_label: string;
  status: ChidoApprovalStatus;
  risk_level: string;
  guardian_agis_required: string[];
  required_before_real_execution: string[];
  requested_by: string;
  reason: string;
  target_id_preview: string;
  target_id_hash: string;
  created_at: string;
  expires_at: string;
  dry_run: true;
  executed: false;
  real_execution_enabled: false;
  research_gate_required: true;
  execution_lock: true;
  contract_version: string;
  approval_layer_version: string;
};

export type ChidoApprovalDecisionData = {
  approval_request_id: string;
  action_id: string;
  decision: "approved" | "rejected";
  guardian_agi: string;
  decided_by: string;
  reason: string;
  dry_run: true;
  executed: false;
  real_execution_enabled: false;
  execution_lock: true;
  approval_layer_version: string;
};

export function chidoApprovalExpiresAt(createdAt: Date = new Date()): string {
  const expires = new Date(createdAt.getTime() + CHIDO_APPROVAL_TTL_HOURS * 60 * 60 * 1000);
  return expires.toISOString();
}

export function chidoApprovalStatusFromDates(status: ChidoApprovalStatus, expiresAt: string): ChidoApprovalStatus {
  if (status !== "pending") return status;

  const expires = new Date(expiresAt).getTime();
  if (!expires) return status;

  return Date.now() > expires ? "expired" : "pending";
}
