import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { tasks } from "@trigger.dev/sdk/v3";
import { ApiError, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global").trim();

    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")?.trim() || "";
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || authHeader !== expectedKey) {
      return NextResponse.json({ error: "Firma de delegación (Dispatch) inválida." }, { status: 401 });
    }

    const sb = createAdminSupabase();

    const { data: controls } = await sb
      .from("system_controls")
      .select("kill_switch, allow_write")
      .eq("project_id", project_id)
      .eq("id", "global")
      .maybeSingle();

    if (controls?.kill_switch) {
      return NextResponse.json({ ok: true, dispatched: 0, message: "Kill-switch activo. Dispatch detenido." }, { status: 200 });
    }

    const { data: commands, error } = await sb
      .from("commands")
      .select("*")
      .eq("project_id", project_id)
      .eq("status", "queued")
      .eq("needs_approval", false)
      .limit(20);

    if (error) throw new ApiError(500, { error: error.message });

    const cloudCommands = (commands ?? []).filter((cmd: any) =>
      String(cmd.node_id || "").startsWith("cloud-") ||
      cmd.node_id === "hocker-fabric" ||
      String(cmd.node_id || "").startsWith("trigger-")
    );

    if (cloudCommands.length === 0) {
      return NextResponse.json({ ok: true, dispatched: 0, message: "No hay tareas de nube en cola." });
    }

    let count = 0;
    for (const cmd of cloudCommands) {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: cmd.id,
          nodeId: cmd.node_id,
          command: cmd.command,
          payload: cmd.payload,
          projectId: cmd.project_id,
        });
        count++;
      } catch (triggerError) {
        console.error(`[TRIGGER.DEV ERROR] Fallo al despachar comando ${cmd.id}:`, triggerError);
      }
    }

    return NextResponse.json({ ok: true, dispatched: count });
  } catch (e: any) {
    const ex = toApiError(e);
    return NextResponse.json(ex.payload, { status: ex.status });
  }
}