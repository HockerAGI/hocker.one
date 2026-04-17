import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
// Importaciones limpias, sin la extensión .js que hacía colapsar a Vercel
import type { AuditActorType, AuditSeverity, AuditChainRow } from "./audit-types";
import { signAuditRow } from "./audit-signature";

// ============================================================================
// NOVA: AGI AUDIT CHAIN CORE (FULL BLOCKCHAIN ARCHITECTURE)
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const sbAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export const nowIso = (): string => new Date().toISOString();

export async function appendAuditRecord(args: {
  projectId: string;
  eventType?: string;
  entityType?: string;
  entityId?: string | null;
  actorType: AuditActorType;
  actorId: string | null;
  role?: string;
  action: string;
  severity: AuditSeverity;
  payload: Record<string, any>;
}): Promise<AuditChainRow | null> {
  
  // 1. Extraemos el bloque anterior para mantener la inmutabilidad de la cadena
  const { data: lastRow } = await sbAdmin
    .from("transactions_audit")
    .select("seq, row_hash")
    .eq("project_id", args.projectId)
    .order("seq", { ascending: false })
    .limit(1)
    .single();

  const seq = lastRow ? lastRow.seq + 1 : 1;
  const prev_hash = lastRow ? lastRow.row_hash : "GENESIS";
  const timestamp = nowIso();
  
  // Llave de seguridad maestra
  const secret = process.env.HKR_SUPPLY_KEY || "hkr-supply-master-key-2026";

  // 2. Preparamos el payload exacto que exige tu motor original
  const signArgs = {
    secret,
    project_id: args.projectId,
    seq,
    prev_hash,
    event_type: args.eventType || "system_event",
    entity_type: args.entityType || "general",
    entity_id: args.entityId || null,
    actor_type: args.actorType,
    actor_id: args.actorId,
    role: args.role || "system",
    action: args.action,
    severity: args.severity,
    payload: args.payload,
    created_at: timestamp
  };

  // 3. Sellamos criptográficamente usando tu código original intacto
  const { row_hash, signature } = signAuditRow(signArgs);

  // 4. Construimos el bloque final para inserción
  const insertPayload = {
    id: crypto.randomUUID(),
    project_id: signArgs.project_id,
    seq: signArgs.seq,
    prev_hash: signArgs.prev_hash,
    row_hash: row_hash,
    event_type: signArgs.event_type,
    entity_type: signArgs.entity_type,
    entity_id: signArgs.entity_id,
    actor_type: signArgs.actor_type,
    actor_id: signArgs.actor_id,
    role: signArgs.role,
    action: signArgs.action,
    severity: signArgs.severity,
    payload: signArgs.payload,
    created_at: signArgs.created_at,
    signature: signature
  };

  const { data, error } = await sbAdmin
    .from("transactions_audit")
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error("[NOVA:Audit] Ruptura en la inserción de cadena transaccional:", error);
    return null;
  }

  return data as AuditChainRow;
}
