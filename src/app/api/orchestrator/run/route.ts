import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getErrorMessage } from "@/lib/errors";
import { signCommand } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type HealthSnapshot = {
  checks?: {
    db?: boolean;
    novaAgi?: boolean;
    langfuse?: boolean;
  };
};

type PlannedAction = {
  command: string;
  priority: "critical" | "medium";
};

type CommandInsertRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  payload: Record<string, unknown>;
  status: "queued";
  needs_approval: boolean;
  signature: string;
  result: null;
  error: null;
  approved_at: null;
  executed_at: null;
  started_at: null;
  finished_at: null;
  created_at: string;
};

function resolveBaseUrl(req: Request): string {
  return (process.env.ORCHESTRATOR_BASE_URL ?? new URL(req.url).origin).replace(/\/+$/, "");
}

function buildActions(health: HealthSnapshot): PlannedAction[] {
  const actions: PlannedAction[] = [];

  if (!health.checks?.db) {
    actions.push({ command: "restart_db", priority: "critical" });
  }

  if (!health.checks?.novaAgi) {
    actions.push({ command: "restart_nova", priority: "critical" });
  }

  if (!health.checks?.langfuse) {
    actions.push({ command: "restart_telemetry", priority: "medium" });
  }

  return actions;
}

export async function POST(req: Request): Promise<NextResponse> {
  const baseUrl = resolveBaseUrl(req);
  const projectId = "hocker-core";
  const nodeId = "orchestrator";
  const secret = String(process.env.COMMAND_HMAC_SECRET ?? "").trim();

  try {
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "COMMAND_HMAC_SECRET no está configurado." },
        { status: 500 }
      );
    }

    const healthRes = await fetch(new URL("/api/health", baseUrl), {
      cache: "no-store",
    });

    if (!healthRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Health check falló con status ${healthRes.status}.`,
        },
        { status: 502 }
      );
    }

    const health = (await healthRes.json()) as HealthSnapshot;
    const actions = buildActions(health);

    if (actions.length === 0) {
      return NextResponse.json({
        ok: true,
        actionsExecuted: 0,
        queued: 0,
        dispatched: 0,
        actions: [],
      });
    }

    const sb = createAdminSupabase();
    const createdAt = new Date().toISOString();

    const rows: CommandInsertRow[] = actions.map((action) => {
      const id = crypto.randomUUID();
      const payload: Record<string, unknown> = {
        auto: true,
        source: "orchestrator",
        priority: action.priority,
      };

      return {
        id,
        project_id: projectId,
        node_id: nodeId,
        command: action.command,
        payload,
        status: "queued",
        needs_approval: false,
        signature: signCommand(secret, id, projectId, nodeId, action.command, payload, createdAt),
        result: null,
        error: null,
        approved_at: null,
        executed_at: null,
        started_at: null,
        finished_at: null,
        created_at: createdAt,
      };
    });

    const { error: insertError } = await sb.from("commands").insert(rows);
    if (insertError) {
      throw insertError;
    }

    let dispatched = 0;

    for (const row of rows) {
      const dispatchRes = await fetch(new URL("/api/commands/dispatch", baseUrl), {
        method: "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          command_id: row.id,
        }),
      });

      if (dispatchRes.ok) {
        dispatched += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      actionsExecuted: actions.length,
      queued: rows.length,
      dispatched,
      actions,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(err),
      },
      { status: 500 }
    );
  }
}