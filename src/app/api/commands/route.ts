import { getErrorMessage } from "@/lib/errors";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import {
  ApiError,
  json,
  parseBody,
  parseQuery,
  requireProjectRole,
  getControls,
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateCommandBody = {
  project_id: string;
  node_id: string;
  command: string;
  payload?: Record<string, unknown>;
};

export async function GET(req: Request): Promise<Response> {
  try {
    const q = parseQuery(req);
    const project_id = normalizeProjectId(q.get("project_id"));

    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
      "viewer",
    ]);

    const { data, error } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new ApiError(500, {
        error: `No se pudo leer la cola de comandos: ${getErrorMessage(error)}`,
      });
    }

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    return json({ ok: false, error: getErrorMessage(err) }, 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await parseBody(req)) as CreateCommandBody;

    if (!body.project_id || !body.node_id || !body.command) {
      throw new ApiError(400, {
        error: "project_id, node_id y command son obligatorios.",
      });
    }

    const ctx = await requireProjectRole(body.project_id, [
      "owner",
      "admin",
      "operator",
    ]);

    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(403, {
        error: "Sistema bloqueado por kill_switch.",
      });
    }

    const needsApproval = ctx.role !== "owner";

    const { data, error } = await ctx.sb
      .from("commands")
      .insert({
        project_id: ctx.project_id,
        node_id: normalizeNodeId(body.node_id),
        command: body.command,
        payload: body.payload ?? {},
        status: needsApproval ? "needs_approval" : "queued",
        needs_approval: needsApproval,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, {
        error: `No se pudo crear el comando: ${getErrorMessage(error)}`,
      });
    }

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    return json({ ok: false, error: getErrorMessage(err) }, 500);
  }
}