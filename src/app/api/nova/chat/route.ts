import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "global").trim();
    const thread_id = body.thread_id ? String(body.thread_id).trim() : null;
    const message = String(body.message ?? body.text ?? "").trim();
    const prefer = String(body.prefer ?? "auto").trim();
    const mode = String(body.mode ?? "auto").trim();

    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });
    if (!message) throw new ApiError(400, { error: "message requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const base = String(process.env.NOVA_AGI_URL || "").trim();
    if (!base) throw new ApiError(500, { error: "NOVA_AGI_URL no está configurado." });

    const key = String(process.env.NOVA_ORCHESTRATOR_KEY || "").trim();
    if (!key) throw new ApiError(500, { error: "NOVA_ORCHESTRATOR_KEY no está configurado." });

    const url = `${base.replace(/\\/+$/, "")}/v1/chat`;

    const allowActions = req.headers.get("x-allow-actions") === "1";

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        project_id,
        thread_id,
        message,
        prefer,
        mode,
        allow_actions: allowActions,
        user_id: ctx.user.id,
        user_email: ctx.user.email ?? null,
      }),
    });

    const text = await upstream.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      const msg = data?.error || data?.message || "NOVA no respondió correctamente.";
      throw new ApiError(upstream.status, { error: msg });
    }

    return json(data, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}