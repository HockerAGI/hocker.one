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
  seq: number;
  prev_hash: string;
  row_hash: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: AuditActorType;
  actor_id: string | null;
  role: string;
  action: string;
  severity: AuditSeverity;
  payload: Record<string, unknown>;
  signature: string;
  created_at: string;
}