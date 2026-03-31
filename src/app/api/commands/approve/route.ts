import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function toBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Aprobación_Manual", metadata: { endpoint: "/api/commands/approve" } });

  try {
    const body = await parseBody(req);
    const id = String(body.id ?? "").trim();
    const project_id = String(body.project_id ?? "global").trim();
    const approved = toBool(body.approved, true);

    if (!id) throw new ApiError(400, { error: "Falta el ID del comando." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Kill Switch activo. No se puede aprobar nada." });
    }

    const { data: cmd, error: fetchErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !cmd) {
      throw new ApiError(404, { error: "Orden no localizada." });
    }

    if (String((cmd as { status?: string }).status ?? "") !== "needs_approval") {
      throw new ApiError(409, { error: "La orden ya no está pendiente de aprobación." });
    }

    if (!approved) {
      const { data, error } = await ctx.sb
        .from("commands")
        .update({
          status: "cancelled",
          needs_approval: false,
          error: "Orden rechazada manualmente.",
          finished_at: new Date().toISOString(),
        })
        .eq("project_id", ctx.project_id)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new ApiError(500, { error: "No se pudo registrar el rechazo." });

      trace.event({ name: "ORDEN_RECHAZADA", input: { commandId: id } });
      return json({ ok: true, item: data });
    }

    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "queued",
        needs_approval: false,
        approved_at: new Date().toISOString(),
        error: null,
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "No se pudo autorizar la orden." });

    await tasks.trigger("hocker-core-executor", { commandId: id });

    trace.event({ name: "ORDEN_AUTORIZADA", input: { commandId: id } });
    return json({ ok: true, item: data, dispatched: true });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}