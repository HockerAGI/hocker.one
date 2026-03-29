import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { Role } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, payload: any) {
    super(typeof payload?.error === "string" ? payload.error : "ApiError");
    this.status = status;
    this.payload = payload ?? { error: "Anomalía no identificada en el servidor." };
  }
}

export function json(payload: any, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function toApiError(e: any) {
  if (e instanceof ApiError) return e;
  const status = typeof e?.status === "number" ? e.status : 500;
  const msg =
    typeof e?.message === "string"
      ? e.message
      : typeof e?.payload?.error === "string"
        ? e.payload.error
        : "Error interno en la matriz.";
  return new ApiError(status, { error: msg });
}

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, { error: "El formato de los datos enviados es inválido. Se esperaba JSON." });
  }
}

export function parseQuery(req: Request) {
  return new URL(req.url).searchParams;
}

export type AuthCtx = {
  sb: Awaited<ReturnType<typeof createServerSupabase>>;
  user: { id: string; email?: string | null };
  project_id: string;
  role: Role;
};

export async function requireProjectRole(project_id: string, allowed: Role[]): Promise<AuthCtx> {
  const sb = await createServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();

  if (authErr || !user) {
    throw new ApiError(401, { error: "Acceso denegado. Protocolo de seguridad no superado." });
  }

  const normalizedProject = normalizeProjectId(project_id);
  const { data: member, error } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", normalizedProject)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: "No se pudo validar la membresía del proyecto." });
  }

  const role = String(member?.role ?? "").toLowerCase() as Role | "";
  if (!role) {
    throw new ApiError(403, { error: "No perteneces a este proyecto." });
  }

  if (!allowed.includes(role)) {
    throw new ApiError(403, { error: "Permisos insuficientes para ejecutar esta operación táctica." });
  }

  return {
    sb,
    user: { id: user.id, email: user.email },
    project_id: normalizedProject,
    role,
  };
}

export async function ensureNode(sb: any, project_id: string, nid: string | null) {
  const nodeId = normalizeNodeId(nid);
  if (!nodeId) return;

  const { data: existing } = await sb
    .from("nodes")
    .select("id")
    .eq("project_id", project_id)
    .eq("id", nodeId)
    .maybeSingle();

  if (existing?.id) return;

  const isCloudNode =
    nodeId.startsWith("cloud-") || nodeId === "hocker-fabric" || nodeId.startsWith("trigger-");

  const { error: insertErr } = await sb.from("nodes").insert({
    id: nodeId,
    project_id,
    name: isCloudNode ? `Nube Central: ${nodeId}` : `Agente Físico: ${nodeId}`,
    type: isCloudNode ? "cloud" : "agent",
    status: isCloudNode ? "online" : "offline",
    last_seen_at: new Date().toISOString(),
    tags: isCloudNode ? ["cloud", "core"] : ["agent"],
    meta: {
      source: "control-plane",
      engine: isCloudNode ? "automation-fabric" : "on-premise",
      trust_level: isCloudNode ? "high" : "pending",
    },
  });

  if (insertErr && !String(insertErr.message || "").toLowerCase().includes("duplicate")) {
    throw new ApiError(500, { error: "Falla de red al intentar registrar el nuevo nodo en la matriz." });
  }
}

export async function getControls(sb: any, project_id: string) {
  const normalizedProject = normalizeProjectId(project_id);

  const { data, error } = await sb
    .from("system_controls")
    .select("project_id,id,kill_switch,allow_write,updated_at")
    .eq("project_id", normalizedProject)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: "Falla crítica al leer los protocolos de seguridad del proyecto." });
  }

  if (!data) {
    const created = {
      project_id: normalizedProject,
      id: "global",
      kill_switch: false,
      allow_write: false,
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await sb.from("system_controls").insert(created);
    if (insertErr) {
      throw new ApiError(500, { error: "Error al inicializar el sistema de gobernanza." });
    }
    return created;
  }

  return data;
}