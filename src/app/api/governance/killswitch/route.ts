import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const controls = await getControls(ctx.sb, project_id);
    return json({ ok: true, controls });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    const kill_switch = !!body.kill_switch;
    const allow_write = !!body.allow_write;

    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner"]);

    const updated_at = new Date().toISOString();

    const { error } = await ctx.sb.from("system_controls").upsert(
      {
        id: "global",
        project_id,
        kill_switch,
        allow_write,
        updated_at,
      },
      { onConflict: "id,project_id" }
    );

    if (error) throw new ApiError(500, { error: "No pude guardar seguridad.", details: error.message });

    await ctx.sb.from("events").insert({
      project_id,
      node_id: null,
      level: kill_switch ? "warn" : "info",
      type: "governance.updated",
      message: `Seguridad actualizada: KillSwitch=${kill_switch ? "ON" : "OFF"}, AllowWrite=${allow_write ? "ON" : "OFF"}`,
      data: { kill_switch, allow_write },
    });

    const controls = await getControls(ctx.sb, project_id);
    return json({ ok: true, controls });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}