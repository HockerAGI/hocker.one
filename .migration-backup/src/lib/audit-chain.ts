import crypto from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { canonicalJson } from "./stable-json";
import { signAuditRow, verifyAuditRow } from "./audit-signature";
import type { AuditActorType, AuditChainRow, AuditSeverity } from "./audit-types";

type AuditDbRow = {
  id: string;
  project_id: string | null;
  actor_user_id: string | null;
  action: string;
  context: Record<string, unknown> | null;
  created_at: string;
};

type AuditFingerprintResult = {
  project_id: string;
  count: number;
  fingerprint: string;
  valid: boolean;
  last_created_at: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function auditSecret(): string {
  const configured = String(process.env.HOCKER_AUDIT_SECRET ?? "").trim();
  if (configured) return configured;

  const fallback = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (fallback) return fallback;

  return "hocker-audit-fallback";
}

function normalizeContext(row: AuditDbRow): Record<string, unknown> {
  const context =
    row.context && typeof row.context === "object" && !Array.isArray(row.context)
      ? row.context
      : {};

  return {
    ...context,
    action: row.action,
    created_at: row.created_at,
    actor_user_id: row.actor_user_id,
    project_id: row.project_id,
  };
}

function rowToVirtualChain(
  row: AuditDbRow,
  index: number,
  prevHash: string,
): AuditChainRow {
  const context = normalizeContext(row);
  const seq = index + 1;

  const signed = signAuditRow({
    secret: auditSecret(),
    project_id: row.project_id ?? "",
    seq,
    prev_hash: prevHash,
    event_type: String(context.event_type ?? "manual"),
    entity_type: String(context.entity_type ?? "system"),
    entity_id: (context.entity_id ?? null) as string | null,
    actor_type: String(context.actor_type ?? "system"),
    actor_id: (context.actor_id ?? null) as string | null,
    role: String(context.role ?? "nova"),
    action: row.action,
    severity: String(context.severity ?? "info"),
    payload:
      context.payload && typeof context.payload === "object" && !Array.isArray(context.payload)
        ? (context.payload as Record<string, unknown>)
        : {},
    created_at: row.created_at,
  });

  return {
    id: row.id,
    project_id: row.project_id ?? "",
    seq,
    prev_hash: prevHash,
    row_hash: signed.row_hash,
    event_type: String(context.event_type ?? "manual"),
    entity_type: String(context.entity_type ?? "system"),
    entity_id: (context.entity_id ?? null) as string | null,
    actor_type: String(context.actor_type ?? "system") as AuditActorType,
    actor_id: (context.actor_id ?? null) as string | null,
    role: String(context.role ?? "nova"),
    action: row.action,
    severity: String(context.severity ?? "info") as AuditSeverity,
    payload:
      context.payload && typeof context.payload === "object" && !Array.isArray(context.payload)
        ? (context.payload as Record<string, unknown>)
        : {},
    created_at: row.created_at,
    signature: signed.signature,
  };
}

async function loadAuditRows(project_id: string, limit = 5000): Promise<AuditDbRow[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("audit_logs")
    .select("id, project_id, actor_user_id, action, context, created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 5000)));

  if (error) {
    throw new Error(`No se pudo cargar la cadena de auditoría: ${error.message}`);
  }

  return (data ?? []) as AuditDbRow[];
}

export async function appendAuditRecord(args: {
  project_id: string;
  action: string;
  actor_user_id?: string | null;
  context?: Record<string, unknown>;
}): Promise<AuditChainRow> {
  const sb = createAdminSupabase();
  const createdAt = nowIso();

  const { data, error } = await sb
    .from("audit_logs")
    .insert({
      project_id: args.project_id,
      actor_user_id: args.actor_user_id ?? null,
      action: args.action,
      context: args.context ?? {},
      created_at: createdAt,
    })
    .select("id, project_id, actor_user_id, action, context, created_at")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo registrar el evento de auditoría: ${error?.message ?? "unknown"}`);
  }

  const rows = await loadAuditRows(args.project_id, 5000);
  const currentIndex = rows.findIndex((row) => row.id === data.id);
  const prevHash =
    currentIndex > 0
      ? rowToVirtualChain(
          rows[currentIndex - 1],
          currentIndex - 1,
          currentIndex > 1
            ? rowToVirtualChain(rows[currentIndex - 2], currentIndex - 2, "GENESIS").row_hash
            : "GENESIS",
        ).row_hash
      : "GENESIS";

  return rowToVirtualChain(data as AuditDbRow, currentIndex >= 0 ? currentIndex : rows.length, prevHash);
}

export async function auditTrailEvent(args: {
  project_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: AuditActorType;
  actor_id: string | null;
  role: string;
  action: string;
  severity: AuditSeverity;
  payload: Record<string, unknown>;
}): Promise<AuditChainRow> {
  return appendAuditRecord({
    project_id: args.project_id,
    action: args.action,
    context: {
      event_type: args.event_type,
      entity_type: args.entity_type,
      entity_id: args.entity_id,
      actor_type: args.actor_type,
      actor_id: args.actor_id,
      role: args.role,
      severity: args.severity,
      payload: args.payload,
      created_at: nowIso(),
    },
    actor_user_id: args.actor_type === "user" ? args.actor_id : null,
  });
}

export async function createAuditFingerprint(project_id: string): Promise<AuditFingerprintResult> {
  const rows = await loadAuditRows(project_id, 5000);

  let prevHash = "GENESIS";
  let fingerprint = "GENESIS";

  rows.forEach((row, index) => {
    const virtual = rowToVirtualChain(row, index, prevHash);
    fingerprint = virtual.row_hash;
    prevHash = virtual.row_hash;
  });

  return {
    project_id,
    count: rows.length,
    fingerprint,
    valid: true,
    last_created_at: rows.at(-1)?.created_at ?? null,
  };
}

export async function verifyAuditChain(
  project_id: string,
  limit = 5000,
): Promise<AuditFingerprintResult & { rows_checked: number }> {
  const rows = await loadAuditRows(project_id, limit);

  let prevHash = "GENESIS";
  let fingerprint = "GENESIS";
  let valid = true;

  rows.forEach((row, index) => {
    const virtual = rowToVirtualChain(row, index, prevHash);

    if (index === 0 || virtual.prev_hash === prevHash) {
      fingerprint = virtual.row_hash;
      prevHash = virtual.row_hash;
      return;
    }

    valid = false;
    fingerprint = virtual.row_hash;
    prevHash = virtual.row_hash;
  });

  return {
    project_id,
    count: rows.length,
    fingerprint,
    valid,
    last_created_at: rows.at(-1)?.created_at ?? null,
    rows_checked: rows.length,
  };
}

export async function appendAuditRow(args: {
  project_id: string;
  action: string;
  actor_user_id?: string | null;
  context?: Record<string, unknown>;
}): Promise<AuditChainRow> {
  return appendAuditRecord(args);
}

export async function verifyAuditRowChain(project_id: string, limit = 5000): Promise<boolean> {
  const result = await verifyAuditChain(project_id, limit);
  return result.valid;
}