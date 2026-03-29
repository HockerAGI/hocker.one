import { NextResponse } from "next/server";
import { createServerSupabase } from "./supabase-server";
import { requireRole } from "./authz";

/**
 * ApiError: El estandard de comunicación de fallas de Hocker One.
 */
export class ApiError extends Error {
  constructor(public status: number, public payload: any) {
    super(payload.error || "Anomalía en la API");
  }
}

/**
 * toApiError: Transforma cualquier excepción en una respuesta controlada.
 */
export function toApiError(e: any): ApiError {
  if (e instanceof ApiError) return e;
  console.error("[NOVA System Trace]", e);
  return new ApiError(500, { error: e.message || "Error interno del servidor en la Matriz." });
}

/**
 * json: Wrapper premium para respuestas de Next.js.
 */
export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, { error: "El cuerpo de la petición está vacío o corrupto." });
  }
}

export function parseQuery(req: Request) {
  return new URL(req.url).searchParams;
}

/**
 * requireProjectRole: El guardia de seguridad de tus rutas API.
 */
export async function requireProjectRole(project_id: string, allowed: any) {
  const sb = await createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  
  if (!user) throw new ApiError(401, { error: "SESIÓN EXPIRADA: Debes re-autenticarte en el búnker." });

  // Consulta de nivel de autoridad en la tabla de miembros
  const { data: member } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .single();

  const role = requireRole(member?.role, allowed);
  return { sb, user, role, project_id };
}

/**
 * getControls: Acceso rápido al Kill Switch y permisos globales.
 */
export async function getControls(sb: any, project_id: string) {
  const { data } = await sb
    .from("system_controls")
    .select("*")
    .eq("project_id", project_id)
    .single();
    
  return {
    kill_switch: data?.kill_switch ?? false,
    allow_write: data?.allow_write ?? false
  };
}
