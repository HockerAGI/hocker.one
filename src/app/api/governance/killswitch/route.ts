import { Langfuse } from "langfuse-node";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

type ControlRow = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: Record<string, unknown>;
  created_at?: string;
  updated_at: string;
};

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

async function loadControls(sb: SupabaseClient, project_id: string): Promise<ControlRow> {
  const { data, error } = await sb
    .from("system_controls")
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: `Falla al leer la matriz de gobernanza: ${getErrorMessage(error)}` });
  }

  if (data) return data as ControlRow;

  const created: ControlRow = {
    id: "global",
    project_id,
    kill_switch: false,
    allow_write: false,
    meta: { source: "governance-route" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await sb
    .from("system_controls")
    .upsert(created, { onConflict: "project_id,id" })
    .select("*")
    .single();

  if (insertErr) {
    throw new ApiError(500, { error: "No se pudo inicializar la soberanía del proyecto." });
  }

  return inserted as ControlRow;
}

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Gobernanza_Lectura", metadata: { endpoint: "/api/governance/killswitch" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_read"] });

    const controls: { kill_switch?: boolean; allow_write?: boolean; [key: string]: unknown } = await loadControls(ctx.sb, ctx.project_id);

    return json({ ok: true, controls });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({ name: "FALLA_LECTURA", level: "ERROR", output: { error: apiErr.message } });
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Gobernanza_Update", metadata: { endpoint: "/api/governance/killswitch" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_write"] });

    const next: ControlRow = {
      id: "global",
      project_id: ctx.project_id,
      kill_switch: toBool(body.kill_switch, false),
      allow_write: toBool(body.allow_write, false),
      meta: body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? (body.meta as Record<string, unknown>) : {},
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await ctx.sb
      .from("system_controls")
      .upsert(next, { onConflict: "project_id,id" })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: `Falla al actualizar protocolos de gobernanza: ${getErrorMessage(error)}` });
    }

    trace.event({ name: "SOBERANIA_ACTUALIZADA", input: next });
    return json({ ok: true, controls: data });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({ name: "FALLA_POST", level: "ERROR", output: { error: apiErr.message } });
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}