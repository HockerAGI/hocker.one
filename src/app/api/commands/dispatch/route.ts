import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { ApiError, json, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({ name: "Dispatch_Tactico", metadata: { endpoint: "/api/commands/dispatch" } });

  try {
    const body: Record<string, unknown> = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || token !== expectedKey) {
      throw new ApiError(401, { error: "Firma de delegación inválida." });
    }

    const project_id = typeof body.project_id === "string" && body.project_id.trim() ? body.project_id.trim() : null;
    const command_id = typeof body.command_id === "string" && body.command_id.trim() ? body.command_id.trim() : null;

    if (!project_id && !command_id) {
      throw new ApiError(400, { error: "Se requiere project_id o command_id." });
    }

    const sb = createAdminSupabase();

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

    const results = await Promise.allSettled(
      cloudCommands.map(async (cmd) => {
        const row = cmd as { id?: string };
        if (!row.id) return false;

        const { error: lockError } = await sb
          .from("commands")
          .update({
            status: "executing",
            started_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("status", "queued");

        if (lockError) return false;

        await tasks.trigger("hocker-core-executor", { commandId: row.id });
        return true;
      }),
    );

    const count = results.filter(
      (r): r is PromiseFulfilledResult<boolean> => r.status === "fulfilled" && r.value === true,
    ).length;

    trace.event({ name: "DESPACHO_COMPLETADO", input: { count, project_id, command_id } });
    return json({ ok: true, dispatched: count });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}