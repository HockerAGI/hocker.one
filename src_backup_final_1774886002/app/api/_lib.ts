import { getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { Role } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/* =========================
   HELPERS CORE
========================= */

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return getErrorMessage(e);

  if (isObject(e) && "message" in e) {
    return String(getErrorMessage(e));
  }

  return String(e);
}

/* =========================
   API ERROR
========================= */

export class ApiError extends Error {
  status: number;
  payload: Record<string, unknown>;

  constructor(status: number, payload: unknown) {
    const safePayload = isObject(payload) ? payload : {};

    const msg =
      typeof safePayload.error === "string"
        ? safePayload.error
        : "Error interno en la matriz.";

    super(msg);

    this.status = status;
    this.payload = safePayload;
  }
}

/* =========================
   RESPONSE
========================= */

export function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;

  let status = 500;

  if (isObject(e) && "status" in e && typeof e.status === "number") {
    status = e.status;
  }

  return new ApiError(status, {
    error: getErrorMessage(e),
  });
}

/* =========================
   REQUEST PARSING
========================= */

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, {
      error: "Formato JSON inválido.",
    });
  }
}

export function parseQuery(req: Request) {
  return new URL(req.url).searchParams;
}

/* =========================
   AUTH
========================= */

export type AuthCtx = {
  sb: SupabaseClient;
  user: { id: string; email?: string | null };
  project_id: string;
  role: Role;
};

export async function requireProjectRole(
  project_id: string,
  allowed: Role[]
): Promise<AuthCtx> {
  const sb = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();

  if (authErr || !user) {
    throw new ApiError(401, {
      error: "Acceso denegado.",
    });
  }

  const normalizedProject = normalizeProjectId(project_id);

  const { data: member, error } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", normalizedProject)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, {
      error: "Error validando membresía.",
    });
  }

  const role = String(member?.role ?? "").toLowerCase() as Role | "";

  if (!role) {
    throw new ApiError(403, {
      error: "No perteneces a este proyecto.",
    });
  }

  if (!allowed.includes(role)) {
    throw new ApiError(403, {
      error: "Permisos insuficientes.",
    });
  }

  return {
    sb,
    user: { id: user.id, email: user.email },
    project_id: normalizedProject,
    role,
  };
}

/* =========================
   NODES (VERSIÓN COMPLETA)
========================= */

export async function ensureNode(
  sb: SupabaseClient,
  project_id: string,
  nid: string | null
) {
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
    nodeId.startsWith("cloud-") ||
    nodeId === "hocker-fabric" ||
    nodeId.startsWith("trigger-");

  const { error } = await sb.from("nodes").insert({
    id: nodeId,
    project_id,
    name: isCloudNode ? `Nube Central: ${nodeId}` : `Agente: ${nodeId}`,
    type: isCloudNode ? "cloud" : "agent",
    status: isCloudNode ? "online" : "offline",
    last_seen_at: new Date().toISOString(),
    tags: isCloudNode ? ["cloud", "core"] : ["agent"],
    meta: {
      engine: isCloudNode ? "automation-fabric" : "on-prem",
      trust: isCloudNode ? "high" : "pending",
    },
  });

  if (error && !getErrorMessage(error).toLowerCase().includes("duplicate")) {
    throw new ApiError(500, {
      error: "Error registrando nodo.",
    });
  }
}

/* =========================
   SYSTEM CONTROLS
========================= */

export async function getControls(
  sb: SupabaseClient,
  project_id: string
) {
  const normalizedProject = normalizeProjectId(project_id);

  const { data, error } = await sb
    .from("system_controls")
    .select("*")
    .eq("project_id", normalizedProject)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, {
      error: "Error leyendo controles.",
    });
  }

  if (!data) {
    const created = {
      project_id: normalizedProject,
      id: "global",
      kill_switch: false,
      allow_write: false,
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await sb
      .from("system_controls")
      .insert(created);

    if (insertErr) {
      throw new ApiError(500, {
        error: "Error inicializando controles.",
      });
    }

    return created;
  }

  return data;
}
