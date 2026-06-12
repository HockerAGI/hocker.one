import { tasks } from "@trigger.dev/sdk/v3";
import { getLangfuse } from "@/lib/langfuse-safe";
import { auditTrailEvent } from "@/lib/audit-chain";
import { getCommandHmacSecret, signCommand } from "@/lib/security";
import {
  ApiError,
  getControls,
  json,
  parseBody,
  requireProjectRole,
  toApiError,
} from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = getLangfuse();

function asBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

function isCloudNode(nodeId: string | null | undefined): boolean {
  return String(nodeId ?? "").startsWith("cloud-");
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Aprobación_Manual",
    metadata: { endpoint: "/api/commands/approve" },
  });

  try {
    const body = await parseBody(req);
    const id = String(body.id ?? "").trim();
    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
    const approved = asBool(body.approved, true);

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    if (!id) {
      throw new ApiError(400, { error: "Falta el ID del comando." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Kill Switch activo. No se puede aprobar nada." });
    }

    const { data: cmd, error: fetchErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !cmd) {
      throw new ApiError(404, { error: "Orden no localizada." });
    }

    if (String((cmd as { status?: string }).status ?? "") !== "needs_approval") {
      throw new ApiError(409, { error: "La orden ya no está pendiente de aprobación." });
    }

    if (!approved) {
      const { data, error } = await ctx.sb
        .from("commands")
        .update({
          status: "canceled",
          needs_approval: false,
          error: "Orden rechazada manualmente.",
          finished_at: new Date().toISOString(),
        })
        .eq("project_id", ctx.project_id)
        .eq("id", id)
        .select("*")
        .single();

      if (error || !data) {
        throw new ApiError(500, { error: "No se pudo registrar el rechazo." });
      }

      await ctx.sb.from("events").insert({
        project_id: ctx.project_id,
        node_id: (data as { node_id?: string | null }).node_id ?? null,
        level: "warn",
        type: "command.rejected",
        message: `Command ${id} rechazada manualmente`,
        data: { command_id: id },
      });

      await auditTrailEvent({
        project_id: ctx.project_id,
        event_type: "command.rejected",
        entity_type: "command",
        entity_id: id,
        actor_type: "user",
        actor_id: ctx.user.id,
        role: ctx.role,
        action: "reject_command",
        severity: "warn",
        payload: { command_id: id },
      });

      trace.event({ name: "ORDEN_RECHAZADA", input: { commandId: id } });
      return json({ ok: true, item: data });
    }

    const approvedAt = new Date().toISOString();
    const commandSecret = getCommandHmacSecret();

    if (!commandSecret) {
      throw new ApiError(500, {
        error: "HOCKER_COMMAND_HMAC_SECRET / COMMAND_HMAC_SECRET no configurado para aprobar comandos.",
      });
    }

    const commandRow = cmd as {
      id: string;
      project_id: string;
      node_id?: string | null;
      command?: string | null;
      payload?: unknown;
    };

    const nodeId = String(commandRow.node_id ?? "");
    const commandName = String(commandRow.command ?? "");
    const payload = commandRow.payload ?? {};

    const signature = signCommand(
      commandSecret,
      commandRow.id,
      commandRow.project_id,
      nodeId,
      commandName,
      payload,
      approvedAt,
    );

    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "queued",
        needs_approval: false,
        approved_at: approvedAt,
        created_at: approvedAt,
        signature,
        error: null,
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(500, { error: "No se pudo autorizar la orden." });
    }

    await ctx.sb.from("events").insert({
      project_id: ctx.project_id,
      node_id: (data as { node_id?: string | null }).node_id ?? null,
      level: "info",
      type: "command.approved",
      message: `Command ${id} aprobada`,
      data: { command_id: id },
    });

    await auditTrailEvent({
      project_id: ctx.project_id,
      event_type: "command.approved",
      entity_type: "command",
      entity_id: id,
      actor_type: "user",
      actor_id: ctx.user.id,
      role: ctx.role,
      action: "approve_command",
      severity: "info",
      payload: { command_id: id },
    });

    if (isCloudNode((data as { node_id?: string | null }).node_id ?? null)) {
      const baseUrl = new URL(req.url).origin.replace(/\/+$/, "");
      const internalSecret = String(
        process.env.HOCKER_ONE_INTERNAL_TOKEN ??
        process.env.CRON_SECRET ??
        "",
      ).trim();

      if (!internalSecret) {
        throw new ApiError(500, {
          error: "HOCKER_ONE_INTERNAL_TOKEN / CRON_SECRET no configurado para despachar cloud.",
        });
      }

      const runRes = await fetch(`${baseUrl}/api/orchestrator/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${internalSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!runRes.ok) {
        throw new ApiError(500, { error: `No se pudo disparar el orquestador cloud: HTTP ${runRes.status}` });
      }
    } else {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: id,
          projectId: ctx.project_id,
        });
      } catch {
        // fallback al polling del agente físico
      }
    }

    trace.event({ name: "ORDEN_AUTORIZADA", input: { commandId: id } });
    return json({ ok: true, item: data, dispatched: true });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({
      name: "FALLA_APROBACION",
      level: "ERROR",
      output: { error: apiErr.payload },
    });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}