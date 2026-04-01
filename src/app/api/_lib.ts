import { getErrorMessage } from "@/lib/errors";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Role, JsonObject } from "@/lib/types";
import { NextResponse } from "next/server";

export type QueryBuilder = {
  select(columns?: string): QueryBuilder;
  eq(column: string, value: string | number | boolean | null): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  insert(values: unknown): QueryBuilder;
  update(values: unknown): QueryBuilder;
  upsert(values: unknown, options?: { onConflict?: string }): QueryBuilder;
  maybeSingle<T = unknown>(): Promise<{ data: T | null; error: unknown }>;
  single<T = unknown>(): Promise<{ data: T; error: unknown }>;
};

export type SupabaseLike = {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email: string | null } | null };
      error: unknown;
    }>;
  };
  from(table: string): QueryBuilder;
};

export class ApiError extends Error {
  status: number;
  payload: { error: string; [key: string]: unknown };
  body: { error: string; [key: string]: unknown };

  constructor(status: number, payload: { error: string; [key: string]: unknown }) {
    super(payload.error || "Anomalía en el servidor.");
    this.status = status;
    this.payload = payload;
    this.body = payload;
  }
}

export function json(payload: unknown, status = 200) {
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

  const status = typeof e === "object" && e && "status" in e ? Number((e as { status?: unknown }).status) || 500 : 500;
  const msg = getErrorMessage(e) || "Error interno en el núcleo de datos.";

  return new ApiError(status, { error: msg });
}

export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Body inválido");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, { error: "Payload ilegible o corrupto." });
  }
}

export function parseQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

type RoleRow = { role: string };

function asDb(sb: unknown): SupabaseLike {
  return sb as SupabaseLike;
}

export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const supabase = await createServerSupabase();
  const pid = normalizeProjectId(project_id);

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new ApiError(401, { error: "Identidad no verificada. Acceso denegado." });
  }

  const { data: member, error: roleErr } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle<RoleRow>();

  const role = member?.role as Role | undefined;

  if (roleErr || !role || !allowedRoles.includes(role)) {
    throw new ApiError(403, {
      error: "Autoridad insuficiente para ejecutar esta acción.",
      required: allowedRoles,
      current: role || "none",
    });
  }

  return { sb: supabase, user, project_id: pid, role };
}

export async function ensureNode(sb: unknown, project_id: string, node_id: string) {
  const db = asDb(sb);
  const nid = normalizeNodeId(node_id);
  const isCloudNode = nid.startsWith("cloud-") || nid === "hocker-fabric";

    // @ts-expect-error - Alineación forzada de DB
  const { error: insertErr } = await db.from("nodes").upsert(
    {
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
      } as JsonObject,
    },
    { onConflict: "project_id,id" },
  );

  if (insertErr) {
    throw new ApiError(500, { error: "Falla de red al intentar registrar el nuevo nodo." });
  }
}

export async function getControls(sb: unknown, project_id: string) {
  const db = asDb(sb);

  const { data, error } = await db
    .from("system_controls")
    .select("project_id,id,kill_switch,allow_write,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: "Falla crítica al leer los protocolos de seguridad." });
  }

  if (!data) {
    return {
      project_id,
      id: "global",
      kill_switch: false,
      allow_write: false,
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}
