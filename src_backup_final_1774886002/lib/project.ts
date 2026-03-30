const FALLBACK_PROJECT = "global";
const CLOUD_NODE_ID = "hocker-fabric"; // Nodo central del Automation Fabric

export function defaultProjectId(): string {
  return normalizeProjectId(
    process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ??
      process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ??
      FALLBACK_PROJECT
  );
}

/**
 * defaultNodeId: Identifica el punto de ejecución por defecto.
 */
export function defaultNodeId(): string {
  const v =
    process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ||
    process.env.HOCKER_DEFAULT_NODE_ID ||
    CLOUD_NODE_ID;

  return normalizeNodeId(v);
}

/**
 * Saneamiento Táctico de IDs
 */
export function normalizeNodeId(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return CLOUD_NODE_ID;
  
  // Estandarización a minúsculas y reemplazo de espacios
  const cleaned = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
    
  return cleaned || CLOUD_NODE_ID;
}

export function normalizeProjectId(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return FALLBACK_PROJECT;
  
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "") || FALLBACK_PROJECT;
}
