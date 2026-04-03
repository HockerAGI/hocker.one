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
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyCommandSignature(
  secret: string,
  signature: string | null | undefined,
  id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: unknown,
  created_at: string,
): boolean {
  if (!signature) return false;
  const expected = signCommand(
    secret,
    id,
    project_id,
    node_id,
    command,
    payload,
    created_at,
  );
  return safeHexEqual(signature, expected);
}