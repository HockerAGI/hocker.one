import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { ApiError, json, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

type DispatchCommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: Record<string, unknown>;
  status: "pending" | "queued" | "needs_approval" | "running";
  needs_approval: boolean;
  signature: string | null;
  created_at: string;
};

function isDispatchCommandRow(value: unknown): value is DispatchCommandRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.project_id === "string" &&
    typeof row.node_id === "string" &&
    typeof row.command === "string" &&
    typeof row.created_at === "string" &&
    typeof row.needs_approval === "boolean"
  );
}

function expectedKey(): string {
  return String(process.env.COMMAND_HMAC_SECRET ?? "").trim();
}

function resolveAppUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").trim();
}

async function dispatchCommandById(row: DispatchCommandRow, token: string): Promise<void> {
  const appUrl = resolveAppUrl();

  if (!appUrl) {
    throw new ApiError(500, {
      error: "NEXT_PUBLIC_APP_URL no está configurado.",
    });
  }

  const res = await fetch(`${appUrl}/api/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      commandId: row.id,
      projectId: row.project_id,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Execution error");
    throw new Error(text || `Fallo al despachar comando ${row.id}.`);
  }
}

async function markFailed(
  sb: ReturnType<typeof createAdminSupabase>,
  row: DispatchCommandRow,
  message: string,
): Promise<void> {
  await sb
    .from("commands")
    .update({
      status: "error",
      error: message,
      finished_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("project_id", row.project_id);
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Dispatch_Tactico",
    metadata: { endpoint: "/api/commands/dispatch" },
  });

  try {
    const body: Record<string, unknown> = await req.json().catch(() => ({}));
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
    const expected = expectedKey();

    if (!expected || token !== expected) {
      throw new ApiError(401, { error: "Firma de delegación inválida." });
    }

    const project_id =
      typeof body.project_id === "string" && body.project_id.trim()
        ? body.project_id.trim()
        : null;

    const command_id =
      typeof body.command_id === "string" && body.command_id.trim()
        ? body.command_id.trim()
        : null;

    if (!project_id && !command_id) {
      throw new ApiError(400, { error: "Se requiere project_id o command_id." });
    }

    const sb = createAdminSupabase();

    let query = sb
      .from("commands")
      .select("id,project_id,node_id,command,payload,status,needs_approval,signature,created_at")
      .in("status", ["pending", "queued"])
      .eq("needs_approval", false);

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    if (command_id) {
      query = query.eq("id", command_id);
    }

    const { data, error } = await query.order("created_at", { ascending: true }).limit(100);

    if (error) {
      throw new ApiError(500, {
        error: `Falla al leer la cola de comandos: ${getErrorMessage(error)}`,
      });
    }

    const rows = Array.isArray(data) ? data.filter(isDispatchCommandRow) : [];

    const results = await Promise.allSettled(
      rows.map(async (row) => {
        const lockedAt = new Date().toISOString();

        const { data: lockData, error: lockError } = await sb
          .from("commands")
          .update({
            status: "running",
            started_at: lockedAt,
          })
          .eq("id", row.id)
          .eq("project_id", row.project_id)
          .eq("status", row.status)
          .select("id")
          .maybeSingle();

        if (lockError || !lockData) {
          return false;
        }

        try {
          await dispatchCommandById(row, expected);
          return true;
        } catch (err: unknown) {
          const message = getErrorMessage(err);
          await markFailed(sb, row, message);
          return false;
        }
      }),
    );

    const dispatched = results.filter(
      (r): r is PromiseFulfilledResult<boolean> => r.status === "fulfilled" && r.value === true,
    ).length;

    trace.event({
      name: "DESPACHO_COMPLETADO",
      input: { dispatched, project_id, command_id },
    });

    return json({
      ok: true,
      dispatched,
      items: rows.map((row) => row.id),
    });
  } catch (err: unknown) {
    const apiErr = toApiError(err);

    trace.event({
      name: "FALLA_DESPACHO",
      level: "ERROR",
      output: { error: apiErr.payload },
    });

    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}