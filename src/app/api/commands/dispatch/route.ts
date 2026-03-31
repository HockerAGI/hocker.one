import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { ApiError, json, toApiError } from "../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Dispatch_Tactico", metadata: { endpoint: "/api/commands/dispatch" } });

  try {
    const body: Record<string, unknown> = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || token !== expectedKey) {
      throw new ApiError(401, { error: "Firma de delegación inválida." });
    }

    const sb = createAdminSupabase();
    const project_id = typeof body.project_id === "string" && body.project_id.trim() ? body.project_id.trim() : null;
    const command_id = typeof body.command_id === "string" && body.command_id.trim() ? body.command_id.trim() : null;

    let query = sb
      .from("commands")
      .select("id,project_id,node_id,command,payload,status,needs_approval,signature,created_at")
      .eq("status", "queued")
      .eq("needs_approval", false);

    if (project_id) query = query.eq("project_id", project_id);
    if (command_id) query = query.eq("id", command_id);

    const { data, error } = await query.order("created_at", { ascending: true }).limit(100);

    if (error) {
      throw new ApiError(500, { error: "Falla al leer la cola de comandos." });
    }

    const cloudCommands = Array.isArray(data) ? data : [];
    let count = 0;

    for (const cmd of cloudCommands) {
      const row = cmd as { id?: string };
      if (!row.id) continue;

      try {
        await tasks.trigger("hocker-core-executor", { commandId: row.id });
        count++;
      } catch (err: unknown) {
        console.error(`[NOVA] Falla en despacho ${row.id}:`, getErrorMessage(err));
      }
    }

    trace.event({ name: "DESPACHO_COMPLETADO", input: { count, project_id, command_id } });
    return json({ ok: true, dispatched: count });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}