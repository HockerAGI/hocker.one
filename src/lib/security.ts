import crypto from "node:crypto";
import { canonicalJson } from "./stable-json";

function getSecretFromEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = String(process.env[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function safeHexEqual(a: string, b: string): boolean {
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

function normalizeSignedTimestamp(value: string): string {
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return value;
  return new Date(ms).toISOString();
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
  const signedCreatedAt = normalizeSignedTimestamp(created_at);
  const base = [id, project_id, node_id, command, signedCreatedAt, canonicalJson(payload)].join("|");
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

// Ventana de tolerancia estricta (5 minutos)
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

  const signedCreatedAt = normalizeSignedTimestamp(created_at);
  const commandTime = new Date(signedCreatedAt).getTime();
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

  return safeHexEqual(expectedSignature, signature);
}