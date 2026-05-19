import { z } from "zod";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import {
  executeGitHubReadOperation,
  getGitHubExecutorStatus,
  hasGitHubRuntimeToken,
  isGitHubReadOperation,
  isGitHubWriteOperation,
  type GitHubRuntimeOperation,
} from "@/lib/github-runtime-executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GitHubOperationSchema = z.enum([
  "get_repo",
  "list_tree",
  "read_file",
  "compare_refs",
  "audit_paths",
  "create_branch",
  "upsert_file",
  "create_pr",
]);

const GitHubActionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  agi_id: z.string().min(1).default("nova"),
  operation: GitHubOperationSchema,
  repository: z.string().min(3).optional(),
  owner: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  ref: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  base: z.string().min(1).optional(),
  head: z.string().min(1).optional(),
  branch: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  message: z.string().optional(),
  content: z.string().optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(1200).optional(),
  dry_run: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

function payloadForQueue(input: z.infer<typeof GitHubActionSchema>) {
  return {
    repository: input.repository ?? null,
    owner: input.owner ?? null,
    repo: input.repo ?? null,
    ref: input.ref ?? null,
    path: input.path ?? null,
    base: input.base ?? null,
    head: input.head ?? null,
    branch: input.branch ?? null,
    title: input.title ?? null,
    body: input.body ?? null,
    message: input.message ?? null,
    content: input.content ?? null,
    include: input.include ?? [],
    exclude: input.exclude ?? [],
    requested_operation: input.operation,
    safety: {
      executed_now: false,
      reason: "Operación de escritura GitHub protegida. Requiere aprobación owner antes de ejecutar.",
    },
  };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);

    return json({
      ok: true,
      project_id: ctx.project_id,
      checked_at: new Date().toISOString(),
      executor: getGitHubExecutorStatus(),
      message: "GitHub Executor real listo para lectura segura. Escritura queda en Owner Gate.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);
    const parsed = GitHubActionSchema.parse(body);
    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
    const operation = parsed.operation as GitHubRuntimeOperation;

    if (!hasGitHubRuntimeToken()) {
      throw new ApiError(409, {
        error: "GitHub no configurado. Falta HOCKER_GITHUB_TOKEN, GITHUB_TOKEN o GH_TOKEN.",
        tool_key: "github",
      });
    }

    if (isGitHubWriteOperation(operation)) {
      const item = await enqueueAgiAction({
        project_id: ctx.project_id,
        agi_id: parsed.agi_id,
        tool_key: "github",
        action_type: `github.${operation}`,
        title: parsed.title || `GitHub ${operation}`,
        payload: payloadForQueue(parsed),
        risk_level: operation === "create_pr" ? "medium" : "high",
        dry_run: true,
        requires_approval: true,
        created_by: ctx.user.id,
      });

      return json(
        {
          ok: true,
          mode: "owner_gate",
          executed: false,
          item,
          message: "Acción GitHub creada en cola segura. No se ejecutó escritura real.",
        },
        202,
      );
    }

    if (!isGitHubReadOperation(operation)) {
      throw new ApiError(400, { error: "Operación GitHub no soportada." });
    }

    const result = await executeGitHubReadOperation(operation, parsed);

    return json({
      ok: true,
      mode: "read_execute",
      executed: true,
      tool_key: "github",
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
