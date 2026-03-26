import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

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
  const trace = langfuse.trace({ name: "Governance_KillSwitch_Update", metadata: { module: "VERTX" } });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner"]);

    const current = await getControls(ctx.sb, project_id);

    const nextKill =
      typeof body.kill_switch === "boolean"
        ? body.kill_switch
        : String(body.action ?? "").toLowerCase() === "on"
          ? true
          : String(body.action ?? "").toLowerCase() === "off"
            ? false
            : current.kill_switch;

    const nextAllow =
      typeof body.allow_write === "boolean"
        ? body.allow_write
        : current.allow_write;

    const updated_at = new Date().toISOString();

    const { error } = await ctx.sb.from("system_controls").upsert(
      {
        id: "global",
        project_id,
        kill_switch: nextKill,
        allow_write: nextAllow,
        updated_at,
      },
      { onConflict: "id,project_id" }
    );

    if (error) throw new ApiError(500, { error: "No pude guardar seguridad.", details: error.message });

    await ctx.sb.from("events").insert({
      project_id,
      node_id: null,
      level: nextKill ? "warn" : "info",
      type: "governance.updated",
      message: `Seguridad actualizada: KillSwitch=${nextKill ? "ON" : "OFF"}, AllowWrite=${nextAllow ? "ON" : "OFF"}`,
      data: { kill_switch: nextKill, allow_write: nextAllow, user: ctx.user.id },
    });

    trace.event({
      name: "Security_Policy_Changed",
      level: nextKill ? "WARNING" : "DEFAULT",
      input: { kill_switch: nextKill, allow_write: nextAllow },
    });

    const controls = await getControls(ctx.sb, project_id);
    trace.update({ statusMessage: "SUCCESS" });
    await langfuse.flushAsync();

    return json({ ok: true, controls });
  } catch (e: any) {
    trace.update({ level: "ERROR", statusMessage: e.message });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}