import type { Role } from "@/lib/types";

// Definimos ApiError aquí localmente para romper la dependencia circular 
// y asegurar que el build no falle.
export class ApiError extends Error {
  constructor(public status: number, public payload: any) {
    super(payload.error || "Acceso Denegado");
  }
}

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

export function requireRole(userRole: any, allowed: Role | Role[]) {
  const ur = normalizeRole(userRole);
  const allowList = Array.isArray(allowed) ? allowed : [allowed];

  if (!ur) {
    throw new ApiError(401, { error: "IDENTIDAD NO DETECTADA: El sistema requiere un rol válido." });
  }
  
  if (!allowList.includes(ur)) {
    throw new ApiError(403, { error: "NIVEL INSUFICIENTE: No tienes autoridad para ejecutar esta acción." });
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
