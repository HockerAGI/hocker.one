export type AuditActorType = "user" | "nova" | "system" | "worker" | string;
export type AuditSeverity = "info" | "warn" | "error" | "critical" | string;

export interface AuditChainRow {
  id?: string;
  project_id: string;
  seq: number;
  prev_hash: string;
  row_hash: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: string;
  actor_id: string | null;
  role: string;
  action: string;
  severity: string;
  payload: Record<string, unknown>;
  created_at: string;
  signature: string;
}export type AuditActorType = "user" | "nova" | "system" | "worker";
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
