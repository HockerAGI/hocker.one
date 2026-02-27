import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Commands_Reject", metadata: { endpoint: "/api/commands/reject" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();

    if (!id) throw new ApiError(400, { error: "Falta id." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "rejection"] });

    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "canceled",
        needs_approval: false,
        error: "Comando rechazado manualmente por el administrador.",
        finished_at: new Date().toISOString(),
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    trace.event({ name: "Command_Cancelled_By_Admin", input: { commandId: id } });
    trace.update({ statusMessage: "SUCCESS" });
    await langfuse.flushAsync();

    return json({ ok: true, item: data }, 200);
  } catch (e: any) {
    trace.update({ level: "ERROR", statusMessage: e.message });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
