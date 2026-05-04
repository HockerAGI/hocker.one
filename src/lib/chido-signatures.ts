import { createHmac, timingSafeEqual } from "crypto";

export const CHIDO_SIGNATURE_LAYER_VERSION = "chido-signature-layer-v0.1.0";
export const CHIDO_SIGNATURE_ALGORITHM = "sha256";
export const CHIDO_SIGNATURE_MAX_SKEW_SECONDS = 300;

export type ChidoSignaturePayload = {
  approval_request_id: string;
  action_id: string;
  target_id_hash: string;
  timestamp: string;
  nonce: string;
};

export function getChidoHmacSecret(): string {
  return process.env.CHIDO_ACTION_HMAC_SECRET || "";
}

export function buildChidoSignatureBase(payload: ChidoSignaturePayload): string {
  return [
    payload.approval_request_id,
    payload.action_id,
    payload.target_id_hash,
    payload.timestamp,
    payload.nonce,
  ].join(".");
}

export function signChidoPayload(payload: ChidoSignaturePayload, secret = getChidoHmacSecret()): string {
  if (!secret) throw new Error("CHIDO_ACTION_HMAC_SECRET no está configurado.");

  return createHmac(CHIDO_SIGNATURE_ALGORITHM, secret)
    .update(buildChidoSignatureBase(payload))
    .digest("hex");
}

export function verifyChidoSignature(payload: ChidoSignaturePayload, signature: string, secret = getChidoHmacSecret()): boolean {
  if (!secret || !signature) return false;

  const expected = signChidoPayload(payload, secret);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function isChidoSignatureTimestampFresh(timestamp: string, now = Date.now()): boolean {
  const parsed = new Date(timestamp).getTime();

  if (!parsed) return false;

  const diff = Math.abs(now - parsed);

  return diff <= CHIDO_SIGNATURE_MAX_SKEW_SECONDS * 1000;
}
