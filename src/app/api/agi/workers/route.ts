import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  createServerlessAgiTask,
  getServerlessAgiWorkerStatus,
  recoverStaleServerlessAgiTasks,
  runServerlessAgiWorkerOnce,
} from "@/lib/serverless-agi-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ProjectSchema = z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one");
const CreateSchema = z.object({
  operation: z.literal("create"),
  project_id: ProjectSchema,
  to_agi: z.string().min(1).max(100),
  subject: z.string().min(1).max(240),
  body: z.string().min(1).max(20_000),
  intent: z.enum(["general", "code", "ops", "finance", "social", "research"]).default("general"),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  write_policy: z.enum(["read_only", "draft_only", "owner_gate"]).default("draft_only"),
  context: z.record(z.unknown()).default({}),
  idempotency_key: z.string().min(8).max(240).optional(),
});
const RunSchema = z.object({
  operation: z.literal("run_once"),
  project_id: ProjectSchema,
  assigned_agi: z.string().min(1).max(100).nullable().optional(),
});
const RecoverSchema = z.object({
  operation: z.literal("recover_stale"),
  project_id: ProjectSchema,
});
const ActionSchema = z.discriminatedUnion("operation", [CreateSchema, RunSchema, RecoverSchema]);

type UntypedSupabase = SupabaseClient<any, "public", any>;

function db(): UntypedSupabase {
  return createAdminSupabase() as unknown as UntypedSupabase;
}

async function loadTasks(projectId: string) {
  const { data, error } = await db()
    .from("agi_tasks")
    .select("id,project_id,agi_id,title,details,status,priority,task_type,assigned_to,request_id,trace_id,write_policy,attempt_count,max_attempts,locked_at,lock_owner,started_at,last_heartbeat_at,completed_at,result_hash,error,output,evidence,created_at,updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    const message = String(error.message ?? "");
    const schemaMissing = message.includes("request_id") || message.includes("schema cache");
    return { tasks: [], schema_query_ready: false, error: schemaMissing ? "AGI_WORKER_SCHEMA_NOT_READY" : message };
  }
  return { tasks: data ?? [], schema_query_ready: true, error: null };
}

async function loadRuns(projectId: string) {
  const { data, error } = await db()
    .from("agi_runs")
    .select("id,project_id,agi_id,task_id,status,provider,model,attempt,worker_id,result_hash,error,started_at,finished_at,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) return [];
  return data ?? [];
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const projectId = ProjectSchema.parse(url.searchParams.get("project_id") || undefined);
    await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);

    const [taskState, runs, status] = await Promise.all([
      loadTasks(projectId),
      loadRuns(projectId),
      getServerlessAgiWorkerStatus(projectId),
    ]);

    return json({
      ok: true,
      project_id: projectId,
      status,
      status_http: status.ready === true ? 200 : 503,
      tasks: taskState.tasks,
      runs,
      schema_query_ready: taskState.schema_query_ready,
      schema_query_error: taskState.error,
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const action = ActionSchema.parse(await parseBody(req));

    if (action.operation === "create") {
      const ctx = await requireProjectRole(action.project_id, ["owner", "admin", "operator"]);
      const result = await createServerlessAgiTask({
        project_id: ctx.project_id,
        to_agi: action.to_agi,
        subject: action.subject,
        body: action.body,
        intent: action.intent,
        priority: action.priority,
        write_policy: action.write_policy,
        context: action.context,
        idempotency_key: action.idempotency_key,
        created_by: ctx.user.id,
      });
      return json(result, result.created === false ? 200 : 201);
    }

    const ctx = await requireProjectRole(action.project_id, ["owner"]);
    if (action.operation === "run_once") {
      const result = await runServerlessAgiWorkerOnce({
        project_id: ctx.project_id,
        assigned_agi: action.assigned_agi ?? null,
        requested_by: ctx.user.id,
      });
      return json(result, result.ok === false ? 502 : 200);
    }

    const result = await recoverStaleServerlessAgiTasks(ctx.project_id);
    return json(result, 200);
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
