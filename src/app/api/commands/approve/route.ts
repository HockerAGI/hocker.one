import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";
import { dispatchCloudCommands, isCloudNode } from "../_cloud";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Commands_Approve", metadata: { endpoint: "/api/commands/approve" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();
    if (!id) throw new ApiError(400, { error: "Falta id." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "approval"] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) throw new ApiError(423, { error: "Kill Switch ON. No se puede aprobar." });
    if (!controls.allow_write) throw new ApiError(423, { error: "allow_write OFF. No se puede aprobar en modo lectura." });

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
      .update({
        status: "queued",
        needs_approval: false,
        approved_at: new Date().toISOString(),
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    // Si es cloud, intenta ejecutar ya
    let cloudDispatch: any = null;
    if (isCloudNode(data.node_id)) {
      try {
        cloudDispatch = await dispatchCloudCommands(ctx.project_id, 10);
      } catch (e: any) {
        cloudDispatch = { dispatched: 0, error: String(e?.message || e) };
      }
    }

    trace.update({ statusMessage: "SUCCESS" });
    await langfuse.flushAsync();
    return json({ ok: true, item: data, cloud: cloudDispatch }, 200);
  } catch (e: any) {
    trace.update({ level: "ERROR", statusMessage: e.message });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}