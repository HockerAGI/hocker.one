import crypto from "node:crypto";

/**
 * Ordenamiento profundo para asegurar firmas idénticas.
 */
function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeysDeep(value[k]);
    return out;
  }
  return value;
}

/**
 * JSON Canónico: El lenguaje universal entre el panel y tus nodos (Termux/Cloud).
 */
export function canonicalJson(value: any): string {
  return JSON.stringify(sortKeysDeep(value ?? {}));
}

/**
 * Sello Digital Hocker (HMAC SHA-256)
 * Blindaje contra manipulación de órdenes.
 */
export function signCommand(
  secret: string,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: any,
  created_at: string
): string {
  const base = [id, project_id, node_id, command, created_at, canonicalJson(payload)].join("|");
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

export function verifyCommandSignature(
  secret: string,
  signature: string | null | undefined,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: any,
  created_at: string
): boolean {
  if (!signature || !secret) return false;

  const expected = signCommand(secret, id, project_id, node_id, command, payload, created_at);
  
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );

  if (!isValid) {
    console.warn(`[VERTX SECURITY] Intento de inyección detectado: Firma inválida para comando ${command} en nodo ${node_id}.`);
  }

  return isValid;
}
