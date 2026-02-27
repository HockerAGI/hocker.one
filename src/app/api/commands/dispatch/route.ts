import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { ApiError, toApiError } from "../../_lib";

export const runtime = "nodejs";

function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function isCloudNode(nodeId: string) {
  return nodeId === "hocker-fabric" || nodeId.startsWith("cloud-") || nodeId.startsWith("trigger-");
}

/**
 * /api/commands/dispatch
 *
 * Seguridad:
 * - Requiere Bearer COMMAND_HMAC_SECRET (solo server-to-server).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global").trim();

    const expected = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!expected) throw new ApiError(500, { error: "Falta COMMAND_HMAC_SECRET." });

    const token = bearer(req);
    if (token !== expected) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    const sb = createAdminSupabase();

    const { data: candidates, error: e1 } = await sb
      .from("commands")
      .select("id, project_id, node_id, command, payload, status, needs_approval")
      .eq("project_id", project_id)
      .eq("status", "queued")
      .eq("needs_approval", false)
      .order("created_at", { ascending: true })
      .limit(20);

    if (e1) throw new ApiError(500, { error: e1.message });

    const cloud = (candidates || []).filter((c: any) => isCloudNode(String(c.node_id || "")));
    if (cloud.length === 0) {
      return NextResponse.json({ ok: true, dispatched: 0, message: "No hay tareas cloud en cola." }, { status: 200 });
    }

    let dispatched = 0;
    let skipped = 0;

    for (const cmd of cloud) {
      const started_at = new Date().toISOString();
      const { data: claimed, error: e2 } = await sb
        .from("commands")
        .update({ status: "running", started_at, executed_at: started_at })
        .eq("project_id", project_id)
        .eq("id", cmd.id)
        .eq("status", "queued")
        .select("id")
        .maybeSingle();

      if (e2 || !claimed?.id) {
        skipped++;
        continue;
      }

      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: cmd.id,
          nodeId: cmd.node_id,
          command: cmd.command,
          payload: cmd.payload,
          projectId: project_id,
        });
        dispatched++;
      } catch (err: any) {
        await sb
          .from("commands")
          .update({ status: "queued", started_at: null, executed_at: null, error: `Trigger error: ${String(err?.message || err)}` })
          .eq("project_id", project_id)
          .eq("id", cmd.id);
        skipped++;
      }
    }

    return NextResponse.json({ ok: true, dispatched, skipped }, { status: 200 });
  } catch (e: any) {
    const ex = toApiError(e);
    return NextResponse.json(ex.payload, { status: ex.status });
  }
}
