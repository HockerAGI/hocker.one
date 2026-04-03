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
    super(payload.error || "Error interno.");
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
    throw new ApiError(400, { error: "Body inválido." });
  }

  return raw;
}

export function json(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Hocker-Status": "OK",
    },
  });
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;

  return new ApiError(500, {
    error: getErrorMessage(e) || "Error interno.",
  });
}

export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const supabase = await createServerSupabase();
  const pid = normalizeProjectId(project_id);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, { error: "No autorizado." });
  }

  const { data, error: roleError } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRoleRow>();

  const role = data?.role;

  if (roleError || !role || !allowedRoles.includes(role)) {
    throw new ApiError(403, { error: "Permisos insuficientes." });
  }

  return {
    sb: supabase,
    user: user as ProjectUser,
    project_id: pid,
    role,
  };
}

export async function ensureNode(
  sb: SupabaseClient,
  project_id: string,
  node_id: string
): Promise<void> {
  const pid = normalizeProjectId(project_id);
  const nid = normalizeNodeId(node_id);
  const now = new Date().toISOString();

  const row: NodeUpsertRow = {
    id: nid,
    project_id: pid,
    name: `Node ${nid}`,
    type: nid.startsWith("cloud") ? "cloud" : "agent",
    status: "online",
    last_seen_at: now,
    tags: [],
    meta: {},
    created_at: now,
    updated_at: now,
  };

  const { error } = await sb.from("nodes").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    throw new ApiError(500, { error: "No se pudo registrar node." });
  }
}

export async function getControls(
  sb: SupabaseClient,
  project_id: string
): Promise<ControlRow> {
  const pid = normalizeProjectId(project_id);

  const { data, error } = await sb
    .from("system_controls")
    .select("*")
    .eq("project_id", pid)
    .eq("id", "global")
    .maybeSingle<ControlRow>();

  if (error) {
    throw new ApiError(500, { error: "Error leyendo controles." });
  }

  if (!data) {
    return {
      id: "global",
      project_id: pid,
      kill_switch: false,
      allow_write: false,
      meta: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}