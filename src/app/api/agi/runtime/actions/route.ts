import { randomUUID } from "node:crypto";
import { z } from "zod";
import { enqueueAgiAction, buildAgiActionIdempotencyKey } from "@/lib/agi-runtime-core";
import { listAgiActions } from "@/lib/agi-action-execution";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeActionInput = {
  project_id: string;
  agi_id: string;
  tool_key?: string | null;
  action_type: string;
  title: string;
  payload: Record<string, unknown>;
  risk_level: "low" | "medium" | "high" | "critical";
  dry_run: boolean;
  requires_approval: boolean;
  trace_id?: string;
  request_id?: string;
  idempotency_key?: string;
};

const ActionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  agi_id: z.string().min(1),
  tool_key: z.string().min(1).nullable().optional(),
  action_type: z.string().min(1),
  title: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  trace_id: z.string().min(1).optional(),
  request_id: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dry_run: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const status = query.get("status") || undefined;
    const toolKey = query.get("tool_key") || undefined;
    const limit = Number(query.get("limit") || 30);
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const actions = await listAgiActions({ project_id: ctx.project_id, status, tool_key: toolKey, limit });

    return json({
      ok: true,
      project_id: ctx.project_id,
      count: actions.length,
      actions,
      message: "Cola Herramientas reales leída con seguridad. Las escrituras reales requieren aprobación owner.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);
    const parsed = ActionSchema.parse(body) as RuntimeActionInput;
    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
    const trace_id = parsed.trace_id ?? randomUUID();
    const request_id = parsed.request_id ?? randomUUID();
    const idempotency_key =
      parsed.idempotency_key ??
      buildAgiActionIdempotencyKey({
        project_id: ctx.project_id,
        agi_id: parsed.agi_id,
        tool_key: parsed.tool_key ?? null,
        action_type: parsed.action_type,
        title: parsed.title,
        payload: parsed.payload,
      });

    const enqueueInput = {
      project_id: ctx.project_id,
      agi_id: parsed.agi_id,
      tool_key: parsed.tool_key ?? null,
      action_type: parsed.action_type,
      title: parsed.title,
      payload: parsed.payload,
      risk_level: parsed.risk_level,
      dry_run: parsed.dry_run,
      requires_approval: parsed.requires_approval,
      created_by: ctx.user.id,
      trace_id,
      request_id,
      idempotency_key,
      execution_state: "queued" as const,
      attempt_count: 0,
      max_attempts: 3,
    };

    const item = await enqueueAgiAction(enqueueInput as Parameters<typeof enqueueAgiAction>[0]);

    return json(
      {
        ok: true,
        item,
        message: item.requires_approval ? "Acción AGI creada en revisión. No ejecuta nada sin aprobación." : "Acción AGI creada en cola segura.",
      },
      201,
    );
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
