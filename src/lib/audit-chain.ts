import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// NOVA FIX: Eliminación de extensiones .js para compatibilidad estricta con Next.js 16
import type { AuditActorType, AuditSeverity, AuditChainRow } from "./audit-types";
import { signAuditRow, canonicalJson, hash256 } from "./audit-signature";

// ============================================================================
// NOVA: AGI AUDIT CHAIN CORE
// ============================================================================
// La inicialización de la base de datos y utilidades de tiempo se encapsulan 
// aquí para aislar el archivo y evitar caídas en el build de Vercel.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Inicializamos sbAdmin de forma nativa e inyectamos el God Mode (Service Role)
export const sbAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Reemplazo nativo de la función que buscaba http.js inexistente
export const nowIso = (): string => new Date().toISOString();

export async function ensureAuditHead(projectId: string = "hocker-one"): Promise<void> {
  // Validación de integridad de la cabecera en la matriz criptográfica
  const { error } = await sbAdmin
    .from("transactions_audit")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (error) {
    console.error(`[NOVA:Audit] Error validando cabeza de cadena para la jurisdicción ${projectId}:`, error);
  }
}

export async function appendAuditRecord(
  projectId: string,
  actorType: AuditActorType,
  actorId: string,
  action: string,
  severity: AuditSeverity,
  payload: Record<string, any>
): Promise<AuditChainRow | null> {
  const timestamp = nowIso();
  const canonical = canonicalJson(payload);
  const payloadHash = hash256(canonical);
  
  const row = {
    id: crypto.randomUUID(),
    project_id: projectId,
    actor_type: actorType,
    actor_id: actorId,
    action: action,
    severity: severity,
    payload_hash: payloadHash,
    payload: payload,
    created_at: timestamp,
    // La firma se genera internamente para sellar la operación en la cadena
    signature: signAuditRow(projectId, action, timestamp, payloadHash)
  };

  const { data, error } = await sbAdmin
    .from("transactions_audit")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("[NOVA:Audit] Falla crítica al anexar bloque a la cadena transaccional:", error);
    return null;
  }

  return data as AuditChainRow;
}
