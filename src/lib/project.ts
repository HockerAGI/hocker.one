const FALLBACK = "global";

/** defaultProjectId(): default estable (client/server) */
export function defaultProjectId(): string {
  // Client: NEXT_PUBLIC_*
  // Server: puede existir DEFAULT_PROJECT_ID, etc.
  const v =
    (process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ||
      process.env.DEFAULT_PROJECT_ID ||
      FALLBACK) ?? FALLBACK;

  return normalizeProjectId(v);
}

/**
 * normalizeProjectId():
 * - trim + lowercase
 * - reemplaza espacios por guiones
 * - permite solo [a-z0-9_-]
 * - si queda vacío -> "global"
 */
export function normalizeProjectId(input: any): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return FALLBACK;

  const spaced = raw.replace(/\s+/g, "-");
  const cleaned = spaced.replace(/[^a-z0-9_-]/g, "");
  return cleaned || FALLBACK;
}