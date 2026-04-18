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

function hexSafeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  try {
    const aBuf = Buffer.from(a, "hex");
    const bBuf = Buffer.from(b, "hex");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function getSecretFromEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = String(process.env[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function getCommandHmacSecret(): string {
  return getSecretFromEnv(["HOCKER_COMMAND_HMAC_SECRET", "COMMAND_HMAC_SECRET"]);
}

export function getInternalApiSecret(): string {
  return getSecretFromEnv([
    "HOCKER_ONE_INTERNAL_TOKEN",
    "NOVA_ORCHESTRATOR_KEY",
    "HOCKER_COMMAND_HMAC_SECRET",
    "COMMAND_HMAC_SECRET",
  ]);
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

const MAX_TIME_DRIFT_MS = 5 * 60 * 1000;

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
  if (!secret) return false;
  if (!signature) return false;

  const commandTime = new Date(created_at).getTime();
  const now = Date.now();

  if (!Number.isFinite(commandTime) || Math.abs(now - commandTime) > MAX_TIME_DRIFT_MS) {
    return false;
  }

  const expectedSignature = signCommand(
    secret,
    id,
    project_id,
    node_id,
    command,
    payload,
    created_at,
  );

  return hexSafeEqual(expectedSignature, signature);
}