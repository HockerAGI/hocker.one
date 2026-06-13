import { createAdminSupabase } from "@/lib/supabase-admin";
import { signAuditRow, verifyAuditRow } from "./audit-signature";
import type { AuditActorType, AuditChainRow, AuditSeverity } from "./audit-types";

type AuditDbRow = {
  id: string;
  project_id: string | null;
  actor_user_id: string | null;
  action: string;
  context: Record<string, unknown> | null;
  created_at: string;
  seq: number | string | null;
  prev_hash: string | null;
  row_hash: string | null;
  signature: string | null;
};

type AuditFingerprintResult = {
  project_id: string;
  count: number;
  fingerprint: string;
  valid: boolean;
  last_created_at: string | null;
  signed_count?: number;
  legacy_count?: number;
  first_invalid_seq?: number | null;
};

const SELECT_COLUMNS =
  "id, project_id, actor_user_id, action, context, created_at, seq, prev_hash, row_hash, signature";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Canonicalizes a timestamp to the exact `Date.toISOString()` form used when
 * signing. Postgres `timestamptz` is re-serialized by PostgREST in a different
 * textual form on read (e.g. `+00:00` offset, trimmed fractional zeros), so the
 * stored string must be normalized before it is re-hashed — otherwise every
 * signed row would fail verification. The write and verify paths MUST use this
 * same normalization to stay symmetric.
 */
function canonicalTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`created_at inválido para la cadena de auditoría: ${value}`);
  }
  return date.toISOString();
}

function auditSecret(): string {
  const configured = String(process.env.HOCKER_AUDIT_SECRET ?? "").trim();
  if (configured) return configured;

  const fallback = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (fallback) return fallback;

  throw new Error(
    "Falta el secreto de auditoría: define HOCKER_AUDIT_SECRET (o, como respaldo, SUPABASE_SERVICE_ROLE_KEY). " +
      "La cadena de auditoría NO firma con un secreto por defecto inseguro; corrige la configuración antes de operar.",
  );
}

/**
 * Deterministically derives the signed fields from a row's stored `context`.
 * The SAME derivation runs at write time and at verify time, so a recomputed
 * signature only matches when the stored row is byte-for-byte intact.
 */
function signingFieldsFromContext(context: Record<string, unknown> | null): {
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: string;
  actor_id: string | null;
  role: string;
  severity: string;
  payload: Record<string, unknown>;
} {
  const ctx =
    context && typeof context === "object" && !Array.isArray(context) ? context : {};

  return {
    event_type: String(ctx.event_type ?? "manual"),
    entity_type: String(ctx.entity_type ?? "system"),
    entity_id: (ctx.entity_id ?? null) as string | null,
    actor_type: String(ctx.actor_type ?? "system"),
    actor_id: (ctx.actor_id ?? null) as string | null,
    role: String(ctx.role ?? "nova"),
    severity: String(ctx.severity ?? "info"),
    payload:
      ctx.payload && typeof ctx.payload === "object" && !Array.isArray(ctx.payload)
        ? (ctx.payload as Record<string, unknown>)
        : {},
  };
}

function toChainRow(row: AuditDbRow): AuditChainRow {
  const fields = signingFieldsFromContext(row.context);

  return {
    id: row.id,
    project_id: row.project_id ?? "",
    seq: Number(row.seq ?? 0),
    prev_hash: row.prev_hash ?? "GENESIS",
    row_hash: row.row_hash ?? "",
    event_type: fields.event_type,
    entity_type: fields.entity_type,
    entity_id: fields.entity_id,
    actor_type: fields.actor_type as AuditActorType,
    actor_id: fields.actor_id,
    role: fields.role,
    action: row.action,
    severity: fields.severity as AuditSeverity,
    payload: fields.payload,
    created_at: row.created_at,
    signature: row.signature ?? "",
  };
}

async function loadAuditRows(project_id: string, limit = 5000): Promise<AuditDbRow[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("audit_logs")
    .select(SELECT_COLUMNS)
    .eq("project_id", project_id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 5000)));

  if (error) {
    throw new Error(`No se pudo cargar la cadena de auditoría: ${error.message}`);
  }

  return (data ?? []) as AuditDbRow[];
}

async function loadChainHead(
  project_id: string,
): Promise<{ seq: number; row_hash: string } | null> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("audit_logs")
    .select("seq, row_hash")
    .eq("project_id", project_id)
    .not("seq", "is", null)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la cabeza de la cadena de auditoría: ${error.message}`);
  }

  if (!data || data.seq == null || data.row_hash == null) return null;

  return { seq: Number(data.seq), row_hash: String(data.row_hash) };
}

export async function appendAuditRecord(args: {
  project_id: string;
  action: string;
  actor_user_id?: string | null;
  context?: Record<string, unknown>;
}): Promise<AuditChainRow> {
  const sb = createAdminSupabase();
  const createdAt = nowIso();
  const context = args.context ?? {};
  const fields = signingFieldsFromContext(context);
  const secret = auditSecret();

  const maxAttempts = 5;
  let lastError = "unknown";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const head = await loadChainHead(args.project_id);
    const seq = (head?.seq ?? 0) + 1;
    const prevHash = head?.row_hash ?? "GENESIS";

    const signed = signAuditRow({
      secret,
      project_id: args.project_id,
      seq,
      prev_hash: prevHash,
      event_type: fields.event_type,
      entity_type: fields.entity_type,
      entity_id: fields.entity_id,
      actor_type: fields.actor_type,
      actor_id: fields.actor_id,
      role: fields.role,
      action: args.action,
      severity: fields.severity,
      payload: fields.payload,
      created_at: canonicalTimestamp(createdAt),
    });

    const { data, error } = await sb
      .from("audit_logs")
      .insert({
        project_id: args.project_id,
        actor_user_id: args.actor_user_id ?? null,
        action: args.action,
        context,
        created_at: createdAt,
        seq,
        prev_hash: prevHash,
        row_hash: signed.row_hash,
        signature: signed.signature,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (!error && data) {
      return toChainRow(data as AuditDbRow);
    }

    lastError = error?.message ?? "unknown";

    // 23505 = unique_violation on (project_id, seq): concurrent writer won the
    // slot. Re-read the head and retry with the next sequence number.
    if (error?.code === "23505") {
      continue;
    }

    throw new Error(`No se pudo registrar el evento de auditoría: ${lastError}`);
  }

  throw new Error(
    `No se pudo registrar el evento de auditoría tras ${maxAttempts} reintentos: ${lastError}`,
  );
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
    },
    actor_user_id: args.actor_type === "user" ? args.actor_id : null,
  });
}

export async function createAuditFingerprint(
  project_id: string,
): Promise<AuditFingerprintResult> {
  const sb = createAdminSupabase();

  const head = await loadChainHead(project_id);

  const { count, error: countError } = await sb
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id);

  if (countError) {
    throw new Error(`No se pudo contar la auditoría: ${countError.message}`);
  }

  const { data: latest, error: latestError } = await sb
    .from("audit_logs")
    .select("created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw new Error(`No se pudo leer la auditoría: ${latestError.message}`);
  }

  return {
    project_id,
    count: count ?? 0,
    fingerprint: head?.row_hash ?? "GENESIS",
    valid: true,
    last_created_at: latest?.created_at ?? null,
  };
}

/**
 * Verifies the persisted, signed audit chain for a project. Each signed row is
 * re-hashed and its HMAC signature recomputed from the STORED data and compared
 * to the STORED signature (tamper of any field breaks the match), and each row's
 * prev_hash is checked against the previous signed row_hash (deletion/reorder
 * breaks the link). Pre-migration rows without a signature are counted as
 * "legacy" and never cause a false failure.
 */
export async function verifyAuditChain(
  project_id: string,
  limit = 5000,
): Promise<AuditFingerprintResult & { rows_checked: number }> {
  const rows = await loadAuditRows(project_id, limit);
  const secret = auditSecret();

  const signed = rows
    .filter(
      (row) =>
        row.signature != null &&
        row.seq != null &&
        row.row_hash != null &&
        row.prev_hash != null,
    )
    .sort((a, b) => Number(a.seq) - Number(b.seq));

  const legacyCount = rows.length - signed.length;

  let valid = true;
  let expectedPrev = "GENESIS";
  let fingerprint = "GENESIS";
  let firstInvalidSeq: number | null = null;

  for (const row of signed) {
    const fields = signingFieldsFromContext(row.context);

    const rowOk = verifyAuditRow({
      secret,
      row: {
        project_id: row.project_id ?? "",
        seq: Number(row.seq),
        prev_hash: row.prev_hash as string,
        row_hash: row.row_hash as string,
        event_type: fields.event_type,
        entity_type: fields.entity_type,
        entity_id: fields.entity_id,
        actor_type: fields.actor_type,
        actor_id: fields.actor_id,
        role: fields.role,
        action: row.action,
        severity: fields.severity,
        payload: fields.payload,
        created_at: canonicalTimestamp(row.created_at),
        signature: row.signature as string,
      },
    });

    const linkOk = (row.prev_hash as string) === expectedPrev;

    if (!rowOk || !linkOk) {
      valid = false;
      if (firstInvalidSeq === null) firstInvalidSeq = Number(row.seq);
    }

    fingerprint = row.row_hash as string;
    expectedPrev = row.row_hash as string;
  }

  return {
    project_id,
    count: rows.length,
    fingerprint,
    valid,
    last_created_at: rows.at(-1)?.created_at ?? null,
    rows_checked: signed.length,
    signed_count: signed.length,
    legacy_count: legacyCount,
    first_invalid_seq: firstInvalidSeq,
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
