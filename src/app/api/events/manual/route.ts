import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { ApiError, ensureNode, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function normalizeLevel(input: unknown): "info" | "warn" | "error" | "critical" {
  const s = String(input ?? "info").trim().toLowerCase();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error") return "error";
  if (s === "critical") return "critical";
  return "info";
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Radar_Lectura", metadata: { endpoint: "/api/events/manual" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "radar_read"] });

    const { data, error } = await ctx.sb
      .from("events")
      .select("*")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new ApiError(500, { error: `Falla al extraer datos de la memoria operativa: ${getErrorMessage(error)}` });

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Registro_Evento", metadata: { endpoint: "/api/events/manual" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const node_id = String(body.node_id ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!project_id) throw new ApiError(400, { error: "Project_ID ausente en instrucción." });
    if (!message) throw new ApiError(400, { error: "No se permiten eventos vacíos en la bitácora." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "manual_event"] });

    if (node_id) await ensureNode(ctx.sb, project_id, node_id);

    const { data: row, error } = await ctx.sb
      .from("events")
      .insert({
        project_id,
        node_id: node_id || null,
        level: normalizeLevel(body.level),
        type: String(body.type ?? "system.manual").trim(),
        message,
        data: asJsonObject(body.data),
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: `Falla interna al grabar en la bitácora táctica: ${getErrorMessage(error)}` });

    trace.event({ name: "EVENTO_REGISTRADO", input: { id: row.id } });
    return json({ ok: true, item: row });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}