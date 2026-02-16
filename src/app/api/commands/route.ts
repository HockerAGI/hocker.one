import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { signCommand } from "@/lib/security";
import type { CommandStatus } from "@/lib/types";
import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, parseQuery, toApiError } from "../_lib";

export const runtime = "nodejs";

const SENSITIVE_COMMANDS = new Set(["run_sql", "shell.exec", "fs.write"]);

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const id = q.get("id");
    const node_id = q.get("node_id");
    const status = q.get("status");

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    let query = ctx.sb.from("commands").select("*").eq("project_id", ctx.project_id).order("created_at", { ascending: false }).limit(100);

    if (id) query = query.eq("id", id);
    if (node_id) query = query.eq("node_id", node_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new ApiError(400, { error: error.message });

    return json({ ok: true, items: data ?? [] }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const node_id = String(body.node_id ?? "").trim();
    const command = String(body.command ?? "").trim();
    const payload = body.payload ?? {};

    if (!node_id) throw new ApiError(400, { error: "Falta node_id." });
    if (!command) throw new ApiError(400, { error: "Falta command." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    await ensureNode(ctx.sb, ctx.project_id, node_id);

    const controls = await getControls(ctx.sb, ctx.project_id);

    const needs_approval = SENSITIVE_COMMANDS.has(command);
    const status: CommandStatus = needs_approval ? "needs_approval" : "queued";

    if (controls.kill_switch) {
      // Kill switch: no corre nada automáticamente
      if (!needs_approval) {
        throw new ApiError(423, { error: "Kill Switch ON: no se pueden ejecutar acciones." });
      }
    }

    const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) throw new ApiError(500, { error: "Falta COMMAND_HMAC_SECRET en el servidor." });

    // OJO: commands.id es UUID en schema, así que aquí SIEMPRE generamos un UUID válido.
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // Firma compatible con el agente (incluye created_at separado)
    const signature = signCommand(secret, id, ctx.project_id, node_id, command, payload, created_at);

    const { data, error } = await ctx.sb
      .from("commands")
      .insert({
        id,
        project_id: ctx.project_id,
        node_id,
        command,
        payload,
        status,
        needs_approval,
        signature,
        created_at,
      })
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    return json({ ok: true, item: data }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
