import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Role } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, payload: any) {
    super(typeof payload?.error === "string" ? payload.error : "ApiError");
    this.status = status;
    this.payload = payload ?? { error: "Error" };
  }
}

export function json(payload: any, status: number = 200) {
  return NextResponse.json(payload, { status });
}

export function toApiError(e: any) {
  if (e instanceof ApiError) return e;
  const msg = typeof e?.message === "string" ? e.message : "Error inesperado";
  return new ApiError(500, { error: msg });
}

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, { error: "Body inválido (JSON requerido)." });
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

export async function requireProjectRole(project_id: string, allowed: Role[]): Promise<AuthCtx> {
  const sb = await createServerSupabase();

  const { data: u, error: uerr } = await sb.auth.getUser();
  if (uerr || !u?.user) throw new ApiError(401, { error: "No autorizado. Inicia sesión." });

  const user = { id: u.user.id, email: u.user.email };

  const { data: mem, error: merr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (merr || !mem?.role) throw new ApiError(403, { error: "No tienes acceso a este proyecto." });

  const role = String(mem.role) as Role;
  if (!allowed.includes(role)) {
    throw new ApiError(403, { error: "Permisos insuficientes para esta acción.", role });
  }

  return { sb, user, project_id, role };
}

export async function ensureNode(sb: any, project_id: string, node_id: string) {
  const nid = String(node_id || "").trim();
  if (!nid) return;

  const { data: existing, error: e1 } = await sb.from("nodes").select("id, project_id").eq("id", nid).maybeSingle();
  if (e1) throw new ApiError(500, { error: "No pude validar el nodo." });

  if (existing?.id && existing.project_id !== project_id) {
    throw new ApiError(400, { error: "Ese nodo pertenece a otro proyecto. Cambia el node_id." });
  }

  if (!existing?.id) {
    const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric" || nid.startsWith("trigger-");

    const { error: e2 } = await sb.from("nodes").insert({
      id: nid,
      project_id,
      name: isCloudNode ? `Virtual Node: ${nid}` : nid,
      type: "agent",
      status: isCloudNode ? "online" : "offline",
      meta: {
        source: "control-plane",
        engine: isCloudNode ? "automation-fabric" : "on-premise",
        trust_level: isCloudNode ? "high" : "pending",
      },
    });

    if (e2 && !String(e2.message || "").toLowerCase().includes("duplicate")) {
      throw new ApiError(500, { error: "No pude crear el nodo automáticamente." });
    }
  }
}

export async function getControls(sb: any, project_id: string) {
  const { data, error } = await sb
    .from("system_controls")
    .select("project_id,id,kill_switch,allow_write,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) throw new ApiError(500, { error: "No pude leer seguridad del proyecto." });

  if (!data) {
    const { error: e2 } = await sb.from("system_controls").insert({
      project_id,
      id: "global",
      kill_switch: false,
      allow_write: false,
      meta: {},
    });

    if (e2) throw new ApiError(500, { error: "No pude crear system_controls.", details: e2.message });

    return { project_id, id: "global", kill_switch: false, allow_write: false, updated_at: null };
  }

  return data;
}