const FALLBACK_PROJECT = "hocker-one";
const CLOUD_NODE_ID = "hocker-fabric";

/**
 * IDENTIFICADOR DE PROYECTO POR DEFECTO
 */
export function defaultProjectId(): string {
  return normalizeProjectId(
    process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ??
    process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID ??
    FALLBACK_PROJECT
  );
}

/**
 * IDENTIFICADOR DE NODO POR DEFECTO
 */
export function defaultNodeId(): string {
  const v =
    process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ||
    process.env.HOCKER_DEFAULT_NODE_ID ||
    CLOUD_NODE_ID;

  return normalizeNodeId(v);
}

/**
 * SANEAMIENTO TÁCTICO DE IDs (NODOS)
 * Erradica caracteres especiales y estandariza para rutas URL seguras.
 */
export function normalizeNodeId(input: string | null | undefined): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return CLOUD_NODE_ID;
  
  const cleaned = raw
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
    
  return cleaned || CLOUD_NODE_ID;
}

/**
 * NORMALIZADOR DE SOBERANÍA (PROYECTOS)
 */
export function normalizeProjectId(input: string | null | undefined): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return FALLBACK_PROJECT;
  
  const cleaned = raw
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
    
  return cleaned || FALLBACK_PROJECT;
}
