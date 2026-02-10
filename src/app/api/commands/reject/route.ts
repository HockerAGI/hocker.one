import { ApiError, ensureNode, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();
    const id = String(body.id ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });
    if (!id) throw new ApiError(400, { error: "id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    const { data: cmd, error: e1 } = await ctx.sb
      .from("commands")
      .select("id, project_id, node_id, command, status, needs_approval")
      .eq("id", id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (e1) throw new ApiError(500, { error: "No pude leer la acción." });
    if (!cmd?.id) throw new ApiError(404, { error: "Acción no encontrada." });
    if (cmd.status !== "needs_approval") throw new ApiError(409, { error: "Esta acción no está esperando aprobación." });

    if (cmd.node_id) await ensureNode(ctx.sb, project_id, cmd.node_id);

    const decided_at = new Date().toISOString();
    const msg = reason ? `Rechazada: ${reason}` : "Rechazada por moderación.";

    const { error: e2 } = await ctx.sb
      .from("commands")
      .update({
        status: "cancelled",
        needs_approval: false,
        approved_at: decided_at,
        error: msg,
      })
      .eq("id", id)
      .eq("project_id", project_id);

    if (e2) throw new ApiError(500, { error: "No pude rechazar la acción.", details: e2.message });

    await ctx.sb.from("events").insert({
      project_id,
      node_id: cmd.node_id ?? null,
      level: "warn",
      type: "command.rejected",
      message: `Acción rechazada: ${cmd.command}`,
      data: { command_id: id, command: cmd.command, reason: reason || null },
    });

    return json({ ok: true });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}