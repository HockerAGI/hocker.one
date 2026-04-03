import { Langfuse } from "langfuse-node";
import {
  ApiError,
  getControls,
  json,
  parseBody,
  requireProjectRole,
  toApiError,
} from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({ name: "Rechazo_Tactico", metadata: { endpoint: "/api/commands/reject" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "hocker-one").trim();
    const id = String(body.id ?? "").trim();

    if (!id) {
      throw new ApiError(400, { error: "Falta el ID del comando a rechazar." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO: Kill Switch activo." });
    }

    const { data: cmdData, error: fetchErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !cmdData) {
      throw new ApiError(404, { error: "Orden no localizada en la memoria." });
    }

    if (String((cmdData as { status?: string }).status ?? "") !== "needs_approval") {
      throw new ApiError(409, { error: "La orden ya no está pendiente de aprobación." });
    }

    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "cancelled",
        needs_approval: false,
        error: "Orden denegada manualmente por el Director.",
        finished_at: new Date().toISOString(),
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: "Falla al registrar el rechazo en la matriz de datos." });
    }

    trace.event({ name: "ORDEN_ANULADA", input: { commandId: id } });
    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({ name: "FALLA_RECHAZO", level: "ERROR", output: { error: apiErr.message } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}