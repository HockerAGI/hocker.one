import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { defaultProjectId } from "@/lib/project";
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
  return (
    process.env.ORCHESTRATOR_BASE_URL ??
    new URL(req.url).origin
  ).replace(/\/+$/, "");
}

function buildActions(health: HealthSnapshot): PlannedAction[] {
  const actions: PlannedAction[] = [];

  if (health.checks?.db === false) {
    actions.push({ command: "restart_db", priority: "critical" });
  }

  if (health.checks?.novaAgi === false) {
    actions.push({ command: "restart_nova", priority: "critical" });
  }

  if (health.checks?.langfuse === false) {
    actions.push({ command: "restart_telemetry", priority: "medium" });
  }

  return actions;
}

export async function POST(req: Request): Promise<NextResponse> {
  const baseUrl = resolveBaseUrl(req);
  const projectId = defaultProjectId;
  const nodeId = "orchestrator";
  const secret = String(process.env.COMMAND_HMAC_SECRET ?? "").trim();

  try {
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "COMMAND_HMAC_SECRET no configurado." },
        { status: 500 },
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
        { status: 502 },
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

    const { error: schemaError } = await sb
      .from("commands")
      .select("needs_approval, signature, approved_at")
      .limit(1);

    if (schemaError) {
      throw new Error("Schema de commands desalineado.");
    }

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
        signature: signCommand(
          secret,
          id,
          projectId,
          nodeId,
          action.command,
          payload,
          createdAt,
        ),
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

    const results = await Promise.allSettled(
      rows.map((row) =>
        fetch(new URL("/api/commands/dispatch", baseUrl), {
          method: "POST",
          headers: {
            authorization: `Bearer ${secret}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
            command_id: row.id,
          }),
        }),
      ),
    );

    const dispatched = results.filter(
      (r): r is PromiseFulfilledResult<Response> => r.status === "fulfilled" && r.value.ok,
    ).length;

    return NextResponse.json({
      ok: true,
      actionsExecuted: actions.length,
      queued: rows.length,
      dispatched,
      actions,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 },
    );
  }
}