import crypto from "node:crypto";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const key of Object.keys(input).sort()) {
      out[key] = sortKeysDeep(input[key]);
    }

    return out;
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value ?? {}));
}

export function signCommand(
  secret: string,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: unknown,
  created_at: string,
): string {
  const base = [
    id,
    project_id,
    node_id,
    command,
    created_at,
    canonicalJson(payload),
  ].join("|");

  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

function safeHexEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  
  // Normalización de longitud para prevenir fugas de información
  const expectedLength = 64; 
  if (a.length !== expectedLength || b.length !== expectedLength) {
    return false;
  }

  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  
  if (aBuf.length !== bBuf.length) return false;
  
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Ventana de tolerancia estricta (5 minutos) contra interceptaciones
const MAX_TIME_DRIFT_MS = 5 * 60 * 1000;

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
  if (!signature) return false;

  // 1. Blindaje contra Replay Attacks
  const commandTime = new Date(created_at).getTime();
  const now = Date.now();
  
  if (isNaN(commandTime) || Math.abs(now - commandTime) > MAX_TIME_DRIFT_MS) {
    console.warn(`[NOVA] Amenaza neutralizada. Comando ${id} rechazado por expiración temporal.`);
    return false;
  }

  // 2. Validación criptográfica
  const expectedSignature = signCommand(
    secret,
    id,
    project_id,
    node_id,
    command,
    payload,
    created_at
  );

  return safeHexEqual(expectedSignature, signature);
}