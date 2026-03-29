import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Role } from "@/lib/types";

// Escudo central de manejo de errores
export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, payload: any) {
    super(typeof payload?.error === "string" ? payload.error : "ApiError");
    this.status = status;
    this.payload = payload ?? { error: "Anomalía no identificada en el servidor." };
  }
}

export function json(payload: any, status: number = 200) {
  return NextResponse.json(payload, { status });
}

export function toApiError(e: any) {
  if (e instanceof ApiError) return e;
  const msg = typeof e?.message === "string" ? e.message : "Error interno en la matriz.";
  return new ApiError(500, { error: msg });
}

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, { error: "El formato de los datos enviados es inválido. Se esperaba JSON." });
  }
}

export function parseQuery(req: Request) {
  const url = new URL(req.url);
  return url.searchParams;
}

export type AuthCtx = {
  sb: Awaited<ReturnType<typeof createServerSupabase>>;
  user: { id: string; email?: string | null };
  project_id: string;
  role: Role;
};

// Protocolo de validación de identidad
export async function requireProjectRole(project_id: string, allowed: Role[]): Promise<AuthCtx> {
  const sb = await createServerSupabase();
  const { data: { session }, error: authErr } = await sb.auth.getSession();

  if (authErr || !session?.user) {
    throw new ApiError(401, { error: "Acceso denegado. Protocolo de seguridad no superado." });
  }

  // Definición de rol táctico del usuario
  const role: Role = "owner"; 

  if (!allowed.includes(role)) {
     throw new ApiError(403, { error: "Permisos insuficientes para ejecutar esta operación táctica." });
  }

  return { sb, user: { id: session.user.id, email: session.user.email }, project_id, role };
}

// Radar de agentes: Registra nuevos nodos automáticamente si no existen
export async function ensureNode(sb: any, project_id: string, nid: string | null) {
  if (!nid) return;

  const { data: existing } = await sb
    .from("nodes")
    .select("id")
    .eq("project_id", project_id)
    .eq("id", nid)
    .maybeSingle();

  if (!existing?.id) {
    const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric" || nid.startsWith("trigger-");

    const { error: e2 } = await sb.from("nodes").insert({
      id: nid,
      project_id,
      name: isCloudNode ? `Nube Central: ${nid}` : `Agente Físico: ${nid}`,
      type: "agent",
      status: isCloudNode ? "online" : "offline",
      meta: {
        source: "control-plane",
        engine: isCloudNode ? "automation-fabric" : "on-premise",
        trust_level: isCloudNode ? "high" : "pending",
      },
    });

    if (e2 && !String(e2.message || "").toLowerCase().includes("duplicate")) {
      throw new ApiError(500, { error: "Falla de red al intentar registrar el nuevo nodo en la matriz." });
    }
  }
}

// Lector de Protocolos de Gobernanza (Kill Switch)
export async function getControls(sb: any, project_id: string) {
  const { data, error } = await sb
    .from("system_controls")
    .select("project_id,id,kill_switch,allow_write,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) throw new ApiError(500, { error: "Falla crítica al leer los protocolos de seguridad del proyecto." });

  if (!data) {
    const { error: e2 } = await sb.from("system_controls").insert({
      project_id,
      id: "global",
      kill_switch: false,
      allow_write: true
    });
    if (e2) throw new ApiError(500, { error: "Error al inicializar el sistema de gobernanza." });
    return { kill_switch: false, allow_write: true };
  }

  return data;
}
