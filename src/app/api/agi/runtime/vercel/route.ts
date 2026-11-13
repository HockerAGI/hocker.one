import { z } from "zod";
import {
  ApiError,
  json,
  parseBody,
  parseQuery,
  requireProjectRole,
  toApiError,
} from "@/app/api/_lib";
import {
  createVercelWriteGatePlan,
  executeVercelReadOperation,
  getVercelExecutorStatus,
  hasVercelRuntimeToken,
  isVercelReadOperation,
  isVercelWriteOperation,
  type VercelRuntimeOperation,
} from "@/lib/vercel-runtime-executor";
import { enqueueAgiAction } from "@/lib/agi-runtime-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VercelOperationSchema = z.enum([
  "get_project",
  "list_deployments",
  "get_deployment_logs",
  "create_project",
]);

const VercelActionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  agi_id: z.string().min(1).default("hostia"),
  operation: VercelOperationSchema,
  vercel_project_id: z.string().min(1).optional(),
  project_name: z.string().min(1).optional(),
  repository: z.string().min(3).optional(),
  framework: z.string().min(1).optional(),
  root_directory: z.string().min(1).optional(),
  install_command: z.string().min(1).optional(),
  team_id: z.string().min(1).optional(),
  deployment_id: z.string().min(1).optional(),
});

function queuePayload(input: z.infer<typeof VercelActionSchema>, plan: Record<string, unknown>) {
  return {
    vercel_project_id: input.vercel_project_id ?? null,
    project_name: input.project_name ?? null,
    repository: input.repository ?? null,
    framework: input.framework ?? null,
    root_directory: input.root_directory ?? null,
    install_command: input.install_command ?? null,
    team_id: input.team_id ?? null,
    deployment_id: input.deployment_id ?? null,
    safety: {
      executed_now: false,
      owner_gate_required: true,
      no_secret_values: true,
      release_policy: "Production deployment remains tied to protected main/release flow.",
    },
    write_plan: plan,
  };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);

    return json({
      ok: true,
      project_id: projectId,
      checked_at: new Date().toISOString(),
      executor: getVercelExecutorStatus(),
      message: "Vercel Executor preparado para lectura. Escritura queda en Owner Gate.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = VercelActionSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);

    if (!hasVercelRuntimeToken()) {
      throw new ApiError(409, {
        error: "Vercel no configurado en Hocker One. Falta VERCEL_TOKEN.",
        tool_key: "vercel",
      });
    }

    const operation = parsed.operation as VercelRuntimeOperation;

    if (isVercelWriteOperation(operation)) {
      const plan = createVercelWriteGatePlan(operation, {
        project_id: ctx.project_id,
        project_name: parsed.project_name,
        repository: parsed.repository,
        framework: parsed.framework,
        root_directory: parsed.root_directory,
        install_command: parsed.install_command,
        team_id: parsed.team_id,
      });

      if (!plan.valid) {
        throw new ApiError(400, {
          error: "Plan Vercel incompleto. No se encola escritura.",
          tool_key: "vercel",
          operation,
          missing_fields: plan.required_fields,
          plan,
        });
      }

      const item = await enqueueAgiAction({
        project_id: ctx.project_id,
        agi_id: parsed.agi_id,
        tool_key: "vercel",
        action_type: `vercel.${operation}`,
        title: `Vercel · ${operation}`,
        payload: queuePayload(parsed, plan),
        risk_level: "high",
        dry_run: true,
        requires_approval: true,
        created_by: ctx.user.id,
      });

      const row = item as Record<string, unknown>;

      return json(
        {
          ok: true,
          mode: "write_gate_plan",
          executed: false,
          queued: true,
          tool_key: "vercel",
          operation,
          project_id: ctx.project_id,
          item: {
            id: row.id ?? null,
            status: row.status ?? "queued",
            risk_level: "high",
            dry_run: true,
            requires_approval: true,
          },
          plan,
          message: "Plan Vercel creado y enviado a cola segura. No se ejecutó escritura real.",
        },
        202,
      );
    }

    if (!isVercelReadOperation(operation)) {
      throw new ApiError(400, { error: "Operación Vercel no soportada." });
    }

    const result = await executeVercelReadOperation(operation, {
      project_id: parsed.vercel_project_id ?? parsed.project_id,
      deployment_id: parsed.deployment_id,
      team_id: parsed.team_id,
    });

    return json({
      ok: true,
      mode: "read_execute",
      executed: true,
      tool_key: "vercel",
      operation,
      project_id: ctx.project_id,
      result,
      safety: {
        write_operation: false,
        owner_gate_required_for_writes: true,
      },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
