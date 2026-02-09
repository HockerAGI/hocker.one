import type { Role } from "@/lib/types";

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
 * requireRole() acepta:
 * - un rol string (ej. "admin")
 * - o un array de roles (ej. ["owner","admin"])
 *
 * Uso típico:
 *   requireRole(userRole, ["owner","admin"])
 */
export function requireRole(userRole: any, allowed: Role | Role[]) {
  const ur = normalizeRole(userRole);
  const allowList = Array.isArray(allowed) ? allowed : [allowed];

  if (!ur) throw new Error("No autorizado: rol inválido o ausente.");
  if (!allowList.includes(ur)) throw new Error("Permisos insuficientes.");

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