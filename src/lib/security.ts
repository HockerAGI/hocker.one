import crypto from "node:crypto";

/**
 * ORDENAMIENTO CANÓNICO PROFUNDO
 * Asegura que el JSON sea idéntico sin importar el orden de las propiedades.
 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  
  if (value && typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const sortedKeys = Object.keys(obj).sort();
    
    for (const key of sortedKeys) {
      out[key] = sortKeysDeep(obj[key]);
    }
    return out;
  }
  return value;
}

/**
 * TRANSFORMADOR A JSON CANÓNICO
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value ?? {}));
}

/**
 * GENERADOR DE FIRMA DIGITAL (HMAC-SHA256)
 * Crea el sello de autenticidad para cada orden emitida por NOVA o el Director.
 */
export function signCommand(
  secret: string,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: unknown,
  created_at: string
): string {
  const base = [
    id, 
    project_id, 
    node_id, 
    command, 
    created_at, 
    canonicalJson(payload)
  ].join("|");
  
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

/**
 * COMPARADOR SEGURO DE TIEMPO
 * Previene ataques de temporización al validar firmas.
 */
function safeTimingEqualHex(aHex: string, bHex: string): boolean {
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * VERIFICADOR DE INTEGRIDAD DE ÓRDENES
 */
export function verifyCommandSignature(
  secret: string,
  signature: string | null | undefined,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: unknown,
  created_at: string
): boolean {
  const sig = String(signature ?? "").trim().toLowerCase();
  if (!secret || !sig || !/^[a-f0-9]{64}$/.test(sig)) return false;

  const expected = signCommand(secret, id, project_id, node_id, command, payload, created_at);
  return safeTimingEqualHex(sig, expected);
}
