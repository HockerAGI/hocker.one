import { NextResponse } from "next/server";
import { signCommand } from "@/lib/security";
import type { CommandStatus } from "@/lib/types";
import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, parseQuery, toApiError } from "../_lib";

export const runtime = "nodejs";

const SENSITIVE_COMMANDS = new Set([
  "run_sql",
  "run_script",
  "write_file",
  "pull_deploy",
  "restart_process",
]);

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("commands")
      .select("id, project_id, node_id, command, status, needs_approval, signature, payload, result, error, created_at, approved_at, executed_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) throw new ApiError(500, { error: "No pude listar acciones." });

    return json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    const node_id = String(body.node_id ?? "").trim();
    const command = String(body.command ?? "").trim();
    const payload = typeof body.payload === "object" && body.payload !== null ? body.payload : {};

    if (!project_id) throw new ApiError(400, { error: "project_id requerido." });
    if (!node_id) throw new ApiError(400, { error: "node_id requerido." });
    if (!command) throw new ApiError(400, { error: "command requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    const controls = await getControls(ctx.sb, project_id);

    if (controls.kill_switch) {
      // Log de bloqueo (sin node_id para evitar FK)
      await ctx.sb.from("events").insert({
        project_id,
        node_id: null,
        level: "warn",
        type: "command.blocked",
        message: `Bloqueado por Kill Switch: ${command}`,
        data: { command, node_id },
      });

      throw new ApiError(423, { error: "El proyecto está en bloqueo total (Kill Switch ON)." });
    }

    // Asegura nodo (FK real)
    await ensureNode(ctx.sb, project_id, node_id);

    const needs_approval = !controls.allow_write && SENSITIVE_COMMANDS.has(command);
    const status: CommandStatus = needs_approval ? "needs_approval" : "queued";

    const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) throw new ApiError(500, { error: "Falta COMMAND_HMAC_SECRET en el servidor." });

    const id = (globalThis.crypto as any)?.randomUUID ? (globalThis.crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
    const created_at = new Date().toISOString();
    const signature = signCommand(secret, id, project_id, node_id, command, { ...payload, created_at });

    const { data: row, error } = await ctx.sb
      .from("commands")
      .insert({
        id,
        project_id,
        node_id,
        command,
        payload,
        status,
        needs_approval,
        signature,
        created_at,
      })
      .select("id, project_id, node_id, command, status, needs_approval, payload, signature, created_at, approved_at, executed_at")
      .single();

    if (error) throw new ApiError(500, { error: "No pude crear la acción.", details: error.message });

    // Evento audit-friendly (real)
    await ctx.sb.from("events").insert({
      project_id,
      node_id,
      level: "info",
      type: needs_approval ? "command.needs_approval" : "command.queued",
      message: needs_approval
        ? `Acción creada y enviada a aprobación: ${command}`
        : `Acción creada y enviada a cola: ${command}`,
      data: { command_id: id, command, node_id },
    });

    return json({ ok: true, command: row, needs_approval }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}