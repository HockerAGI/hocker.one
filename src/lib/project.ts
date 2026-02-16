const FALLBACK = "global";

const FALLBACK_NODE = "node-hocker-01";

export function defaultProjectId(): string {
  return normalizeProjectId(
    process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ??
      process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ??
      FALLBACK
  );
}

/**
 * defaultNodeId(): default estable (client/server)
 * - Client: NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID
 * - Server: HOCKER_DEFAULT_NODE_ID
 */
export function defaultNodeId(): string {
  const v =
    (process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ||
      process.env.HOCKER_DEFAULT_NODE_ID ||
      FALLBACK_NODE) ?? FALLBACK_NODE;

  return normalizeNodeId(v);
}

/**
 * normalizeNodeId():
 * - trim
 * - reemplaza espacios por guiones
 * - permite solo [a-zA-Z0-9._-]
 */
export function normalizeNodeId(input: any): string {
  const raw = String(input ?? "").trim();
  if (!raw) return FALLBACK_NODE;
  const spaced = raw.replace(/\s+/g, "-");
  const cleaned = spaced.replace(/[^a-zA-Z0-9._-]/g, "");
  return cleaned || FALLBACK_NODE;
}

export function normalizeProjectId(input: any): string {
  const raw = String(input ?? "").trim();
  if (!raw) return FALLBACK;
  return raw.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "") || FALLBACK;
}
