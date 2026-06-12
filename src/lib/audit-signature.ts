import crypto from "node:crypto";
import { stableStringify } from "./stable-json";

export function hash256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmac256(secret: string, input: string): string {
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

export function signAuditRow(args: {
  secret: string;
  project_id: string;
  seq: number;
  prev_hash: string;
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
}): { row_hash: string; signature: string } {
  const canonical = stableStringify({
    project_id: args.project_id,
    seq: args.seq,
    prev_hash: args.prev_hash,
    event_type: args.event_type,
    entity_type: args.entity_type,
    entity_id: args.entity_id,
    actor_type: args.actor_type,
    actor_id: args.actor_id,
    role: args.role,
    action: args.action,
    severity: args.severity,
    payload: args.payload,
    created_at: args.created_at,
  });

  const row_hash = hash256(canonical);
  const signature = hmac256(
    args.secret,
    `${row_hash}|${args.prev_hash}|${args.seq}|${args.project_id}`,
  );

  return { row_hash, signature };
}

export function verifyAuditRow(args: {
  secret: string;
  row: {
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
  };
}): boolean {
  const expected = signAuditRow({
    secret: args.secret,
    project_id: args.row.project_id,
    seq: args.row.seq,
    prev_hash: args.row.prev_hash,
    event_type: args.row.event_type,
    entity_type: args.row.entity_type,
    entity_id: args.row.entity_id,
    actor_type: args.row.actor_type,
    actor_id: args.row.actor_id,
    role: args.row.role,
    action: args.row.action,
    severity: args.row.severity,
    payload: args.row.payload,
    created_at: args.row.created_at,
  });

  return expected.row_hash === args.row.row_hash && expected.signature === args.row.signature;
}