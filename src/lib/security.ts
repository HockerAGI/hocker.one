import crypto from "node:crypto";

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
 * canonicalJson():
 * JSON ordenado y estable para que la firma sea idéntica entre panel y agente.
 */
export function canonicalJson(value: any): string {
  return JSON.stringify(sortKeysDeep(value ?? {}));
}

/**
 * Firma HMAC estable (DEBE match con hocker-node-agent/src/lib/signature.ts)
 * base = id | project_id | node_id | command | created_at | canonical(payload)
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
  if (!signature) return false;
  const expected = signCommand(secret, id, project_id, node_id, command, payload, created_at);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
