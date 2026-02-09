import crypto from "node:crypto";

function stableJson(v: any) {
  // JSON estable (lo suficiente) para firmar payloads
  // Nota: si el payload trae keys en distinto orden, esto puede variar;
  // en hocker.one normalmente el payload viene ya estable.
  return JSON.stringify(v ?? {});
}

/**
 * Firma HMAC para commands (server -> node runner).
 * Misma firma la puedes verificar en tu agente/node si quieres.
 */
export function signCommand(
  secret: string,
  command_id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: any
) {
  const h = crypto.createHmac("sha256", secret);
  h.update(command_id);
  h.update("|");
  h.update(project_id);
  h.update("|");
  h.update(node_id);
  h.update("|");
  h.update(command);
  h.update("|");
  h.update(stableJson(payload));
  return h.digest("hex");
}

export function verifyCommandSignature(
  secret: string,
  signature: string,
  command_id: string,
  project_id: string,
  node_id: string,
  command: string,
  payload: any
) {
  const expected = signCommand(secret, command_id, project_id, node_id, command, payload);
  try {
    const a = Buffer.from(String(signature ?? ""), "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}