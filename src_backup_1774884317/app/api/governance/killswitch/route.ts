import { Langfuse } from "langfuse-node";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

async function loadControls(sb: unknown, project_id: string) {
  const { data, error } = await sb
    .from("system_controls")
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, { error: "Falla al leer la matriz de gobernanza." });
  }

  if (data) return data;

  const created = {
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
    throw new ApiError(500, { error: "No se pudo inicializar el sistema de gobernanza." });
  }

  return inserted ?? created;
}

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Lectura_Gobernanza", metadata: { endpoint: "/api/governance/killswitch" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "governance"] });

    const controls = await loadControls(ctx.sb, ctx.project_id);

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, controls });
  } catch (e: unknown) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_LECTURA", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Gobernanza_Actualizacion", metadata: { endpoint: "/api/governance/killswitch" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_write"] });

    const kill_switch = Boolean(body.kill_switch);
    const allow_write = Boolean(body.allow_write);

    const next = {
      id: "global",
      project_id: ctx.project_id,
      kill_switch,
      allow_write,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await ctx.sb
      .from("system_controls")
      .upsert(next, { onConflict: "project_id,id" })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: "No se pudo actualizar el panel de gobernanza." });
    }

    trace.event({ name: "GOBERNANZA_ACTUALIZADA", input: next });
    return json({ ok: true, controls: data ?? next });
  } catch (e: unknown) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_GOBERNANZA", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}