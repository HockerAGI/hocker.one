import { getErrorMessage } from "@/lib/errors";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import { createServerSupabase } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { JsonObject, Role } from "@/lib/types";

type ApiBody = Record<string, unknown>;

type AuthUser = {
  id: string;
  email: string | null;
};

type ProjectMemberRow = {
  role: Role;
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: { error: string; [key: string]: unknown };

  constructor(status: number, body: { error: string; [key: string]: unknown }) {
    super(body.error || "Error interno.");
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function isPlainObject(value: unknown): value is ApiBody {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

export async function parseBody(req: Request): Promise<ApiBody> {
  const raw: unknown = await req.json().catch(() => ({}));
  if (!isPlainObject(raw)) {
    throw new ApiError(400, { error: "El cuerpo debe ser un JSON objeto válido." });
  }
  return raw;
}

export function json(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "X-Hocker-Status": "Nominal",
    },
  });
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (typeof err === "object" && err !== null) {
    const maybe = err as {
      status?: unknown;
      body?: unknown;
      message?: unknown;
    };

    const status = typeof maybe.status === "number" ? maybe.status : 500;
    if (isPlainObject(maybe.body) && typeof maybe.body.error === "string") {
      return new ApiError(status, maybe.body as { error: string; [key: string]: unknown });
    }

    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return new ApiError(status, { error: maybe.message });
    }
  }

  return new ApiError(500, {
    error: getErrorMessage(err) || "Error interno en la matriz.",
  });
}

export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const sb = await createServerSupabase();
  const normalizedProjectId = normalizeProjectId(project_id);

  const {
    data: { user },
    error: userError,
  } = await sb.auth.getUser();

  if (userError || !user) {
    throw new ApiError(401, { error: "Sesión inválida. Acceso denegado." });
  }

  const { data: member, error: memberError } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", normalizedProjectId)
    .eq("user_id", user.id)
    .maybeSingle<ProjectMemberRow>();

  if (memberError) {
    throw new ApiError(500, {
      error: `No se pudo verificar la membresía del proyecto: ${getErrorMessage(memberError)}`,
    });
  }

  const role = member?.role;

  if (!role || !allowedRoles.includes(role)) {
    throw new ApiError(403, {
      error: "Autoridad insuficiente para ejecutar esta acción.",
      required: allowedRoles,
      current: role ?? "none",
    });
  }

  return {
    sb,
    user: user as AuthUser,
    project_id: normalizedProjectId,
    role,
  };
}

export async function ensureNode(
  sb: SupabaseClient,
  project_id: string,
  node_id: string,
): Promise<void> {
  const pid = normalizeProjectId(project_id);
  const nid = normalizeNodeId(node_id);
  const now = new Date().toISOString();

  const isCloud = nid.startsWith("cloud-") || nid === "hocker-fabric";

  const row: {
    id: string;
    project_id: string;
    name: string;
    type: "cloud" | "agent";
    status: "online" | "offline" | "degraded";
    last_seen_at: string;
    tags: string[];
    meta: JsonObject;
    created_at: string;
    updated_at: string;
  } = {
    id: nid,
    project_id: pid,
    name: isCloud ? `Núcleo: ${nid}` : `Agente: ${nid}`,
    type: isCloud ? "cloud" : "agent",
    status: isCloud ? "online" : "offline",
    last_seen_at: now,
    tags: isCloud ? ["cloud", "core"] : ["agent"],
    meta: {
      source: "control-plane",
      trust: isCloud ? "high" : "pending",
    },
    created_at: now,
    updated_at: now,
  };

  const { error } = await sb.from("nodes").upsert(row, { onConflict: "id" });

  if (error) {
    throw new ApiError(500, {
      error: `No se pudo registrar el nodo: ${getErrorMessage(error)}`,
    });
  }
}

type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
};

export async function getControls(sb: SupabaseClient, project_id: string): Promise<ControlRow> {
  const pid = normalizeProjectId(project_id);
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("system_controls")
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .eq("project_id", pid)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, {
      error: `No se pudo leer la matriz de gobernanza: ${getErrorMessage(error)}`,
    });
  }

  if (data) {
    return {
      id: String(data.id),
      project_id: String(data.project_id),
      kill_switch: Boolean(data.kill_switch),
      allow_write: Boolean(data.allow_write),
      meta: (data.meta && typeof data.meta === "object" && !Array.isArray(data.meta))
        ? (data.meta as JsonObject)
        : {},
      created_at: String(data.created_at),
      updated_at: String(data.updated_at),
    };
  }

  return {
    id: "global",
    project_id: pid,
    kill_switch: false,
    allow_write: false,
    meta: {},
    created_at: now,
    updated_at: now,
  };
}