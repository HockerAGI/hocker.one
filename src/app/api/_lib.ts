import { getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { Role } from "@/lib/types";

/**
 * PROTOCOLO DE EXCEPCIONES TÁCTICAS
 * Centraliza los fallos de la Matriz para respuestas rápidas y seguras.
 */
export class ApiError extends Error {
  status: number;
  payload: { error: string; [key: string]: unknown };

  constructor(status: number, payload: { error: string; [key: string]: unknown }) {
    super(payload.error || "Anomalía en el servidor.");
    this.status = status;
    this.payload = payload;
  }
}

/**
 * GENERADOR DE RESPUESTAS DINÁMICAS (JSON)
 * Inyecta cabeceras de seguridad y control de caché para inmediatez absoluta.
 */
export function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "X-Hocker-Status": "Nominal",
    },
  });
}

/**
 * NORMALIZADOR DE ERRORES DE LA MATRIZ
 * Transforma cualquier excepción en una respuesta estructurada de grado militar.
 */
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  
  const status = (e as { status?: number })?.status || 500;
  const msg = getErrorMessage(e) || "Error interno en el núcleo de datos.";
  
  return new ApiError(status, { error: msg });
}

/**
 * EXTRACCIÓN SEGURA DE DATOS (BODY)
 */
export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, { error: "Payload ilegible o corrupto." });
  }
}

/**
 * PARSEADOR DE CONSULTAS (QUERY)
 */
export function parseQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

/**
 * VALIDACIÓN DE AUTORIDAD Y RANGO (RBAC)
 * Verifica que el agente tenga el nivel de acceso requerido en el proyecto.
 */
export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const supabase = await createServerSupabase();
  const pid = normalizeProjectId(project_id);

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new ApiError(401, { error: "Identidad no verificada. Acceso denegado." });
  }

  // Consulta de rango en la Matriz
  const { data: member, error: roleErr } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleErr || !member || !allowedRoles.includes(member.role as Role)) {
    throw new ApiError(403, { 
      error: "Autoridad insuficiente para ejecutar esta acción.",
      required: allowedRoles,
      current: member?.role || "none"
    });
  }

  return { sb: supabase, user, project_id: pid, role: member.role as Role };
}

/**
 * REGISTRO DE NODOS (ENSURE NODE)
 * Sincroniza la existencia de un nodo en la red antes de procesar órdenes.
 */
export async function ensureNode(sb: any, project_id: string, node_id: string) {
  const nid = normalizeNodeId(node_id);
  const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric";

  const { error: insertErr } = await sb.from("nodes").upsert({
    project_id,
    id: nid,
    name: isCloudNode ? `Núcleo: ${nid}` : `Agente Físico: ${nid}`,
    type: isCloudNode ? "cloud" : "agent",
    status: isCloudNode ? "online" : "offline",
    last_seen_at: new Date().toISOString(),
    tags: isCloudNode ? ["cloud", "core"] : ["agent"],
    meta: {
      source: "control-plane",
      engine: isCloudNode ? "automation-fabric" : "on-premise",
      trust_level: isCloudNode ? "high" : "pending",
    },
  }, { onConflict: 'project_id,id' });

  if (insertErr) {
    throw new ApiError(500, { error: "Falla de red al intentar registrar el nuevo nodo." });
  }
}

/**
 * MONITOR DE SOBERANÍA (GET CONTROLS)
 * Obtiene el estado actual de los interruptores de emergencia (Kill Switch).
 */
export async function getControls(sb: any, project_id: string) {
  const { data, error } = await sb
    .from("system_controls")
    .select("project_id,id,kill_switch,allow_write,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: "Falla crítica al leer los protocolos de seguridad." });
  }

  // Si no existe, inicializamos el control en estado seguro
  if (!data) {
    const fallback = {
      project_id,
      id: "global",
      kill_switch: false,
      allow_write: false,
      updated_at: new Date().toISOString(),
    };
    return fallback;
  }

  return data;
}
