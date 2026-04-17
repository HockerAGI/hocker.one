import crypto from "node:crypto";
import { sbAdmin } from "./supabase.js";
import { nowIso } from "./http.js";
import type { AuditActorType, AuditSeverity, AuditChainRow } from "./audit-types.js";
import { signAuditRow, canonicalJson, hash256 } from "./audit-signature.js";

export async function ensureAuditHead(project_id: string) {
  const sb = sbAdmin();
  const { data, error } = await sb
    .from("audit_chain_heads")
    .select("*")
    .eq("project_id", project_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data;

  const created = {
    project_id,
    last_hash: "",
    last_seq: 0,
    updated_at: nowIso()
  };

  const { data: inserted, error: insertErr } = await sb
    .from("audit_chain_heads")
    .insert(created)
    .select("*")
    .single();

  if (insertErr || !inserted) throw new Error(insertErr?.message || "No se pudo crear audit head.");
  return inserted;
}

export async function appendAuditChainEvent(args: {
  project_id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  actor_type: AuditActorType;
  actor_id?: string | null;
  role: string;
  action: string;
  severity?: AuditSeverity;
  payload?: Record<string, unknown>;
}): Promise<AuditChainRow> {
  const sb = sbAdmin();
  const head = await ensureAuditHead(args.project_id);

  const seq = Number(head.last_seq) + 1;
  const created_at = nowIso();
  const prev_hash = String(head.last_hash ?? "");
  const severity = args.severity ?? "info";
  const payload = args.payload ?? {};

  const { row_hash, signature } = signAuditRow({
    secret: process.env.NOVA_COMMAND_HMAC_SECRET ?? "",
    project_id: args.project_id,
    seq,
    prev_hash,
    event_type: args.event_type,
    entity_type: args.entity_type,
    entity_id: args.entity_id ?? null,
    actor_type: args.actor_type,
    actor_id: args.actor_id ?? null,
    role: args.role,
    action: args.action,
    severity,
    payload,
    created_at
  });

  const { data, error } = await sb
    .from("audit_chain")
    .insert({
      id: crypto.randomUUID(),
      project_id: args.project_id,
      seq,
      prev_hash,
      row_hash,
      event_type: args.event_type,
      entity_type: args.entity_type,
      entity_id: args.entity_id ?? null,
      actor_type: args.actor_type,
      actor_id: args.actor_id ?? null,
      role: args.role,
      action: args.action,
      severity,
      payload,
      signature,
      created_at
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "No se pudo insertar audit chain.");

  const { error: headErr } = await sb
    .from("audit_chain_heads")
    .update({
      last_hash: row_hash,
      last_seq: seq,
      updated_at: nowIso()
    })
    .eq("project_id", args.project_id);

  if (headErr) throw new Error(headErr.message);

  return data as AuditChainRow;
}

export async function verifyAuditChain(project_id: string, limit = 1000) {
  const sb = sbAdmin();

  const { data, error } = await sb
    .from("audit_chain")
    .select("*")
    .eq("project_id", project_id)
    .order("seq", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AuditChainRow[];
  let prev = "";
  let ok = true;
  const invalid: Array<{ seq: number; reason: string }> = [];

  for (const row of rows) {
    if (row.prev_hash !== prev) {
      ok = false;
      invalid.push({ seq: row.seq, reason: "prev_hash mismatch" });
    }

    const expected = signAuditRow({
      secret: process.env.NOVA_COMMAND_HMAC_SECRET ?? "",
      project_id: row.project_id,
      seq: row.seq,
      prev_hash: row.prev_hash,
      event_type: row.event_type,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_type: row.actor_type,
      actor_id: row.actor_id,
      role: row.role,
      action: row.action,
      severity: row.severity,
      payload: row.payload,
      created_at: row.created_at
    });

    if (expected.row_hash !== row.row_hash || expected.signature !== row.signature) {
      ok = false;
      invalid.push({ seq: row.seq, reason: "hash/signature mismatch" });
    }

    prev = row.row_hash;
  }

  return {
    ok,
    total: rows.length,
    invalid
  };
}

export async function auditTrailEvent(args: {
  project_id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  actor_type: AuditActorType;
  actor_id?: string | null;
  role: string;
  action: string;
  severity?: AuditSeverity;
  payload?: Record<string, unknown>;
}) {
  const row = await appendAuditChainEvent(args);

  await sbAdmin().from("events").insert({
    id: crypto.randomUUID(),
    project_id: args.project_id,
    node_id: null,
    type: `audit.${args.event_type}`,
    message: `${args.action} on ${args.entity_type}`,
    level: args.severity === "critical" || args.severity === "error" ? "error" : args.severity === "warn" ? "warn" : "info",
    data: {
      audit_chain_id: row.id,
      seq: row.seq,
      row_hash: row.row_hash,
      signature: row.signature,
      entity_id: args.entity_id ?? null,
      ...args.payload
    },
    created_at: nowIso()
  });

  return row;
}

export async function createAuditFingerprint(project_id: string) {
  const check = await verifyAuditChain(project_id, 5000);
  const digest = hash256(canonicalJson({
    project_id,
    ok: check.ok,
    total: check.total,
    invalid: check.invalid
  }));

  return {
    ...check,
    fingerprint: digest
  };
}