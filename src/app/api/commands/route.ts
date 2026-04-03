import crypto from "node:crypto";
import { tasks } from "@trigger.dev/sdk/v3";
import { signCommand } from "@/lib/security";
import { normalizeNodeId } from "@/lib/project";
import type { JsonObject } from "@/lib/types";

import {
  ApiError,
  ensureNode,
  getControls,
  json,
  parseBody,
  requireProjectRole,
  toApiError,
} from "../_lib";

export const runtime = "nodejs";

type CommandInsert = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: JsonObject;
  status: "queued" | "needs_approval";
  needs_approval: boolean;
  signature: string;
  created_at: string;
};

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    const command = String(body.command ?? "").trim();

    if (!project_id || !command) {
      throw new ApiError(400, { error: "Datos incompletos." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Sistema bloqueado." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "Modo lectura." });
    }

    const node_id = normalizeNodeId(String(body.node_id ?? "hocker-fabric"));
    const payload = (body.payload ?? {}) as JsonObject;
    const needsApproval = Boolean(body.needs_approval);

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    const secret = process.env.COMMAND_HMAC_SECRET;
    if (!secret) throw new ApiError(500, { error: "Falta HMAC secret." });

    await ensureNode(ctx.sb, ctx.project_id, node_id);

    const signature = signCommand(
      secret,
      id,
      ctx.project_id,
      node_id,
      command,
      payload,
      created_at
    );

    const row: CommandInsert = {
      id,
      project_id: ctx.project_id,
      node_id,
      command,
      payload,
      status: needsApproval ? "needs_approval" : "queued",
      needs_approval: needsApproval,
      signature,
      created_at,
    };

    const { data, error } = await ctx.sb
      .from("commands")
      .insert(row)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Insert failed." });

    if (!needsApproval) {
      await tasks.trigger("hocker-core-executor", { commandId: id });
    }

    return json({ ok: true, item: data }, 201);
  } catch (err) {
    const e = toApiError(err);
    return json(e.payload, e.status);
  }
}