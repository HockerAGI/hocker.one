import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();

    if (!id) throw new ApiError(400, { error: "Falta id." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Kill Switch ON: no se pueden aprobar acciones." });
    }

    const { data: cmd, error: cmdErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (cmdErr) throw new ApiError(400, { error: cmdErr.message });
    if (!cmd?.id) throw new ApiError(404, { error: "Comando no encontrado." });

    await ensureNode(ctx.sb, ctx.project_id, cmd.node_id);

    const { data, error } = await ctx.sb
      .from("commands")
      .update({ status: "queued", needs_approval: false, approved_at: new Date().toISOString() })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    return json({ ok: true, item: data }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
