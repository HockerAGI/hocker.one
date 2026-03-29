import type { Role } from "@/lib/types";
import { ApiError } from "./_lib"; // Enlace directo a nuestra matriz de errores

const RANK: Record<Role, number> = {
  owner: 4,
  admin: 3,
  operator: 2,
  viewer: 1,
};

function normalizeRole(role: any): Role | null {
  const r = String(role ?? "").toLowerCase().trim();
  if (r === "owner" || r === "admin" || r === "operator" || r === "viewer") return r;
  return null;
}

/**
 * Protocolo de Autoridad Estricta
 */
export function requireRole(userRole: any, allowed: Role | Role[]) {
  const ur = normalizeRole(userRole);
  const allowList = Array.isArray(allowed) ? allowed : [allowed];

  if (!ur) {
    throw new ApiError(401, { error: "ACCESO DENEGADO: No se detectó un rol válido en la sesión." });
  }
  
  if (!allowList.includes(ur)) {
    throw new ApiError(403, { error: "AUTORIDAD INSUFICIENTE: Tu nivel de acceso no permite esta operación." });
  }

  return ur;
}

export function hasAtLeast(userRole: any, minRole: Role): boolean {
  const ur = normalizeRole(userRole);
  if (!ur) return false;
  return RANK[ur] >= RANK[minRole];
}

export function hasAny(userRole: any, allowed: Role | Role[]): boolean {
  const ur = normalizeRole(userRole);
  if (!ur) return false;
  const allowList = Array.isArray(allowed) ? allowed : [allowed];
  return allowList.includes(ur);
}
