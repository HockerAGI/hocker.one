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
  sb: ReturnType<typeof createServerSupabase>;
  user: { id: string; email?: string | null };
  project_id: string;
  role: Role;
};

/**
 * requireProjectRole()
 * - Sesión Supabase real (cookies)
 * - Membership real por project_id
 * - Bloquea si no eres miembro o si tu rol no está permitido
 */
export async function requireProjectRole(project_id: string, allowed: Role[]): Promise<AuthCtx> {
  const sb = createServerSupabase();

  const { data: u, error: uerr } = await sb.auth.getUser();
  if (uerr) throw new ApiError(401, { error: "No autorizado. Inicia sesión." });
  if (!u?.user) throw new ApiError(401, { error: "No autorizado. Inicia sesión." });

  const user = { id: u.user.id, email: u.user.email };

  const { data: mem, error: merr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (merr) throw new ApiError(403, { error: "No tienes acceso a este proyecto." });
  if (!mem?.role) throw new ApiError(403, { error: "No tienes acceso a este proyecto." });

  const role = String(mem.role) as Role;
  if (!allowed.includes(role)) {
    throw new ApiError(403, {
      error: "Permisos insuficientes para esta acción.",
      role,
    });
  }

  return { sb, user, project_id, role };
}

/**
 * ensureNode()
 * - Tu schema tiene FK commands.node_id -> nodes.id
 * - Si mandas un node_id que no existe, insertamos un nodo “auto”
 * - Si ese node_id existe pero pertenece a OTRO proyecto => bloqueamos
 */
export async function ensureNode(sb: any, project_id: string, node_id: string) {
  const nid = String(node_id || "").trim();
  if (!nid) return;

  const { data: existing, error: e1 } = await sb
    .from("nodes")
    .select("id, project_id")
    .eq("id", nid)
    .maybeSingle();

  if (e1) throw new ApiError(500, { error: "No pude validar el nodo." });

  if (existing?.id && existing.project_id !== project_id) {
    throw new ApiError(400, { error: "Ese nodo pertenece a otro proyecto. Cambia el node_id." });
  }

  if (!existing?.id) {
    const { error: e2 } = await sb.from("nodes").insert({
      id: nid,
      project_id,
      name: nid,
      tags: ["auto"],
      meta: { source: "control-plane" },
    });

    // Si falla por algo distinto a “duplicate” lo levantamos
    if (e2 && !String(e2.message || "").toLowerCase().includes("duplicate")) {
      throw new ApiError(500, { error: "No pude crear el nodo automáticamente." });
    }
  }
}

export async function getControls(sb: any, project_id: string) {
  const { data, error } = await sb
    .from("system_controls")
    .select("id, project_id, kill_switch, allow_write, updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) throw new ApiError(500, { error: "No pude leer seguridad del proyecto." });

  return (
    data ?? {
      id: "global",
      project_id,
      kill_switch: false,
      allow_write: false,
      updated_at: null,
    }
  );
}