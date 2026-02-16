import { NextResponse } from "next/server";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "global").trim();
    const thread_id = body.thread_id ? String(body.thread_id).trim() : null;
    const message = String(body.message ?? "").trim();
    const prefer = body.prefer ? String(body.prefer).trim() : null;
    const mode = body.mode ? String(body.mode).trim() : "chat";

    if (!message) throw new ApiError(400, { error: "Falta message." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const url = String(process.env.NOVA_AGI_URL || "").trim();
    const key = String(process.env.NOVA_ORCHESTRATOR_KEY || "").trim();
    if (!url || !key) throw new ApiError(500, { error: "Faltan NOVA_AGI_URL / NOVA_ORCHESTRATOR_KEY en el servidor." });

    const wantActions = req.headers.get("x-allow-actions") === "1";
    const allowActions = wantActions && (ctx.role === "owner" || ctx.role === "admin");

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        // Enviamos el header también, por compatibilidad con orquestadores que lo usan.
        "x-allow-actions": allowActions ? "1" : "0",
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
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
