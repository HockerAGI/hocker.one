export type AuditActorType = "user" | "nova" | "system" | "worker";
export type AuditSeverity = "info" | "warn" | "error" | "critical";

export interface AuditChainHeadRow {
  project_id: string;
  last_hash: string;
  last_seq: number;
  updated_at: string;
}

export interface AuditChainRow {
  id: string;
  project_id: string;
  actor_type: AuditActorType;
  actor_id: string;
  action: string;
  severity: AuditSeverity;
  payload_hash: string;
  payload: Record<string, any>;
  signature: string;
  created_at: string;
}
