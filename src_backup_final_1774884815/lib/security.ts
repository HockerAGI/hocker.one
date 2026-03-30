import crypto from "node:crypto";

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
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
  created_at: string
): string {
  const base = [id, project_id, node_id, command, created_at, canonicalJson(payload)].join("|");
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

function safeTimingEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (!a.length || !b.length || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

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
  if (!secret || !sig || !/^[a-f0-9]+$/.test(sig)) return false;

  const expected = signCommand(secret, id, project_id, node_id, command, payload, created_at);

  const ok = safeTimingEqualHex(sig, expected);
  if (!ok) {
    console.warn(
      `[VERTX SECURITY] Firma inválida detectada para comando ${command} en nodo ${node_id}.`
    );
  }
  return ok;
}