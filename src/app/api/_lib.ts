import { getErrorMessage } from "@/lib/errors";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import { createServerSupabase } from "@/lib/supabase-server";
import type { JsonObject, Role } from "@/lib/types";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: { error: string; [key: string]: unknown };

  constructor(status: number, payload: { error: string; [key: string]: unknown }) {
    super(payload.error || "Anomalía en el servidor.");
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiBody = Record<string, unknown>;

type ProjectUser = {
  id: string;
  email: string | null;
};

type ProjectRoleRow = {
  role: Role;
};

type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: JsonObject;
  created_at: string;
  updated_at: string;
};

type NodeUpsertRow = {
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
};

function isPlainObject(value: unknown): value is ApiBody {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

export async function parseBody(req: Request): Promise<ApiBody> {
  const raw: unknown = await req.json().catch(() => ({}));
  if (!isPlainObject(raw)) {
    throw new ApiError(400, { error: "El cuerpo debe ser un objeto JSON válido." });
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

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;

  const status =
    typeof e === "object" && e !== null && "status" in e
      ? Number((e as { status?: unknown }).status) || 500
      : 500;

  return new ApiError(status, { error: getErrorMessage(e) || "Error interno en el núcleo de datos." });
}

export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const supabase = await createServerSupabase();
  const pid = normalizeProjectId(project_id);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new ApiError(401, { error: "Identidad no verificada. Acceso denegado." });
  }

  const { data: member, error: roleErr } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRoleRow>();

  const role = member?.role;

  if (roleErr || !role || !allowedRoles.includes(role)) {
    throw new ApiError(403, {
      error: "Autoridad insuficiente para ejecutar esta acción.",
      required: allowedRoles,
      current: role ?? "none",
    });
  }

  return {
    sb: supabase,
    user: user as ProjectUser,
    project_id: pid,
    role,
  };
}

export async function ensureNode(sb: SupabaseClient, project_id: string, node_id: string): Promise<void> {
  const pid = normalizeProjectId(project_id);
  const nid = normalizeNodeId(node_id);
  const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric";
  const timestamp = new Date().toISOString();

  const row: NodeUpsertRow = {
    id: nid,
    project_id: pid,
    name: isCloudNode ? `Núcleo: ${nid}` : `Agente: ${nid}`,
    type: isCloudNode ? "cloud" : "agent",
    status: isCloudNode ? "online" : "offline",
    last_seen_at: timestamp,
    tags: isCloudNode ? ["cloud", "core"] : ["agent"],
    meta: {
      source: "control-plane",
      engine: isCloudNode ? "automation-fabric" : "on-premise",
      trust_level: isCloudNode ? "high" : "pending",
    },
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { error } = await sb.from("nodes").upsert(row, { onConflict: "id" });

  if (error) {
    throw new ApiError(500, { error: `Falla de red al registrar el nodo: ${getErrorMessage(error)}` });
  }
}

export async function getControls(sb: SupabaseClient, project_id: string): Promise<ControlRow> {
  const pid = normalizeProjectId(project_id);

  const { data, error } = await sb
    .from("system_controls")
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .eq("project_id", pid)
    .eq("id", "global")
    .maybeSingle<ControlRow>();

  if (error) {
    throw new ApiError(500, { error: `Falla al leer la matriz de gobernanza: ${getErrorMessage(error)}` });
  }

  if (data) {
    return {
      id: data.id,
      project_id: data.project_id,
      kill_switch: Boolean(data.kill_switch),
      allow_write: Boolean(data.allow_write),
      meta: data.meta ?? {},
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  const now = new Date().toISOString();
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