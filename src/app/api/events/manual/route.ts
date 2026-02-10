import { ApiError, ensureNode, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("events")
      .select("id, project_id, node_id, level, type, message, data, created_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new ApiError(500, { error: "No pude listar eventos." });

    return json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    const node_id = String(body.node_id ?? "").trim();
    const level = String(body.level ?? "info").trim();
    const type = String(body.type ?? "manual").trim();
    const message = String(body.message ?? "").trim();
    const data = typeof body.data === "object" && body.data !== null ? body.data : null;

    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });
    if (!message) throw new ApiError(400, { error: "message requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    if (node_id) await ensureNode(ctx.sb, project_id, node_id);

    const { data: row, error } = await ctx.sb
      .from("events")
      .insert({
        project_id,
        node_id: node_id || null,
        level,
        type,
        message,
        data,
      })
      .select("id, project_id, node_id, level, type, message, data, created_at")
      .single();

    if (error) throw new ApiError(500, { error: "No pude registrar el evento.", details: error.message });

    return json({ ok: true, event: row }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}