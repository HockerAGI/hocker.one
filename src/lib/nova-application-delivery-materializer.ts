import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { hasGitHubRuntimeToken } from "@/lib/github-runtime-executor";
import { hasVercelRuntimeToken, verifyVercelConnection } from "@/lib/vercel-runtime-executor";
import { buildNovaChatActionDraftPreview } from "@/lib/nova-chat-action-drafts";
import { canResumeOwnApplicationBootstrap, githubBootstrapParentState, stableNovaApplicationBootstrapId } from "@/lib/nova-application-bootstrap-identity";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { AGI_QUEUE_BLOCKING_STATUSES } from "@/lib/agi-queue-lock";

export const NOVA_APPLICATION_DELIVERY_VERSION = "12.8A-1";

type QueueLockLike = {
  locked?: boolean;
  can_start_new_task?: boolean;
  reason?: string;
  blocking_count?: number;
  source?: string;
  active_actions?: Array<{ id?: unknown; status?: unknown }>;
};

function slug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || "nova-app";
}

/** Only a genuinely persisted, exclusively own bootstrap may continue under Queue Lock. */
async function isOwnBootstrapResume(params: {
  project_id: string;
  created_by: string;
  repository_name: string;
  bootstrap_id: string;
  queue_lock?: QueueLockLike | null;
}): Promise<boolean> {
  const lock = params.queue_lock;
  if (!lock || lock.locked !== true || lock.can_start_new_task !== false ||
      lock.source !== "supabase" || !Array.isArray(lock.active_actions) ||
      !Number.isSafeInteger(lock.blocking_count) ||
      (lock.blocking_count ?? 0) > 8 || (lock.blocking_count ?? 0) < 1) return false;

  try {
    const sb = createAdminSupabase();
    const [blocking, own] = await Promise.all([
      sb.from("agi_action_queue")
        .select("id,project_id,created_by,agi_id,tool_key,action_type,status,payload",
          { count: "exact" })
        .eq("project_id", params.project_id)
        .in("status", [...AGI_QUEUE_BLOCKING_STATUSES]).limit(9),
      sb.from("agi_action_queue")
        .select("id,project_id,created_by,agi_id,tool_key,action_type,status,payload")
        .eq("project_id", params.project_id)
        .eq("created_by", params.created_by)
        .contains("payload", { bootstrap_id: params.bootstrap_id })
        .in("action_type", ["github.create_repository", "vercel.create_project"]).limit(3),
    ]);
    if (blocking.error || own.error || blocking.count === null ||
        blocking.count !== blocking.data?.length || blocking.count > 8) return false;

    return canResumeOwnApplicationBootstrap({
      project_id: params.project_id,
      created_by: params.created_by,
      bootstrap_id: params.bootstrap_id,
      repository_name: params.repository_name,
      queue_lock: lock,
      all_blocking_rows: (blocking.data ?? []) as Record<string, unknown>[],
      own_bootstrap_rows: (own.data ?? []) as Record<string, unknown>[],
    });
  } catch {
    // Provider/database errors must never bypass global Queue Lock.
    return false;
  }
}

function enqueueGitHubRepository(params: {
  project_id: string;
  created_by: string;
  name: string;
  bootstrap_id: string;
}) {
  return enqueueAgiAction({
    project_id: params.project_id,
    agi_id: "hostia",
    tool_key: "github",
    action_type: "github.create_repository",
    title: `HOSTIA · Crear repositorio ${params.name}`,
    payload: {
      owner: "HockerAGI",
      name: params.name,
      description: `Proyecto creado por NOVA bajo HOCKER Build Fabric · ${params.bootstrap_id}`,
      private: true,
      visibility: "private",
      bootstrap_id: params.bootstrap_id,
      safety: {
        owner_gate_required: true,
        executed_now: false,
        no_main_direct_write: true,
        private_by_default: true,
      },
    },
    risk_level: "high",
    dry_run: true,
    requires_approval: true,
    created_by: params.created_by,
  });
}

function enqueueVercelProject(params: {
  project_id: string;
  created_by: string;
  projectName: string;
  repository: string;
  bootstrap_id: string;
  depends_on_action_id: string;
}) {
  return enqueueAgiAction({
    project_id: params.project_id,
    agi_id: "hostia",
    tool_key: "vercel",
    action_type: "vercel.create_project",
    title: `HOSTIA · Crear proyecto Vercel ${params.projectName}`,
    payload: {
      project_name: params.projectName,
      repository: params.repository,
      team_id: process.env.VERCEL_TEAM_ID ?? null,
      bootstrap_id: params.bootstrap_id,
      depends_on_action_id: params.depends_on_action_id,
      safety: {
        owner_gate_required: true,
        executed_now: false,
        no_secret_values: true,
        production_deploy_via_main: true,
      },
    },
    risk_level: "high",
    dry_run: true,
    requires_approval: true,
    created_by: params.created_by,
  });
}

export async function materializeNovaApplicationDeliveryFromChat(params: {
  project_id: string;
  message: string;
  queue_lock?: QueueLockLike | null;
  created_by: string;
}) {
  const preview = buildNovaChatActionDraftPreview({
    project_id: params.project_id,
    message: params.message,
    queue_lock: params.queue_lock,
  });

  if (!preview || preview.scope !== "application_delivery") return preview;

  const repositoryName = `app-${slug(params.message)}`;
  const projectName = repositoryName;
  const bootstrapId = stableNovaApplicationBootstrapId({
    project_id: params.project_id,
    created_by: params.created_by,
    repository_name: repositoryName,
  });

  // A global Queue Lock still blocks unrelated work. Only a read-back of
  // every blocking row + the authenticated Owner’s own existing bootstrap
  // can permit continuing this same GitHub -> Vercel chain.
  if (!preview.can_enqueue && !(await isOwnBootstrapResume({
    project_id: params.project_id,
    created_by: params.created_by,
    repository_name: repositoryName,
    bootstrap_id: bootstrapId,
    queue_lock: params.queue_lock,
  }))) return preview;

  const blockers: string[] = [];
  if (!hasGitHubRuntimeToken()) blockers.push("GitHub: falta token de runtime.");
  if (!hasVercelRuntimeToken()) {
    blockers.push("Vercel: falta VERCEL_TOKEN de runtime.");
  } else if (!(await verifyVercelConnection())) {
    blockers.push("Vercel: el token existe o está configurado, pero la lectura autenticada no fue verificada.");
  }

  if (blockers.length > 0) {
    return {
      ...preview,
      can_enqueue: false,
      materialized: false,
      enqueued: false,
      executed: false,
      reason: "Build Fabric detectada pero falta configuración real de infraestructura.",
      current_limit: blockers.join(" "),
      next_step: "Configurar las credenciales server-side y repetir la solicitud; no se almacenan secretos en la cola.",
    };
  }

  // Stable identity makes a verified same-chain replay idempotent; it does
  // not permit a new application while unrelated Queue Lock rows are pending.
  const github = await enqueueGitHubRepository({
    project_id: params.project_id,
    created_by: params.created_by,
    name: repositoryName,
    bootstrap_id: bootstrapId,
  });
  const githubRow = github as Record<string, unknown>;
  const githubParent = githubBootstrapParentState(githubRow);
  if (!githubParent.eligible || !githubParent.id) {
    return {
      ...preview,
      version: NOVA_APPLICATION_DELIVERY_VERSION,
      materialized: false,
      enqueued: true,
      executed: false,
      reason: "El paso GitHub está rechazado, incompleto o no es aprobable. No se encoló Vercel.",
      current_limit: "GITHUB_BOOTSTRAP_PARENT_NOT_ELIGIBLE",
      next_step: "Revisar la acción GitHub existente en Owner Gate; no duplicar el bootstrap.",
      bootstrap: { id: bootstrapId, repository: `HockerAGI/${repositoryName}`,
        actions: [{ id: githubParent.id, action_type: "github.create_repository",
          status: githubParent.status || "unknown" }] },
    };
  }

  const vercel = await enqueueVercelProject({
    project_id: params.project_id,
    created_by: params.created_by,
    projectName,
    repository: `HockerAGI/${repositoryName}`,
    bootstrap_id: bootstrapId,
    depends_on_action_id: githubParent.id,
  });
  const vercelRow = vercel as Record<string, unknown>;
  const vercelState = githubBootstrapParentState(vercelRow);
  if (!vercelState.eligible) {
    return {
      ...preview,
      version: NOVA_APPLICATION_DELIVERY_VERSION,
      materialized: false,
      enqueued: true,
      executed: false,
      reason: "La acción Vercel existente no es aprobable. No se duplicó ni se ejecutó.",
      current_limit: "VERCEL_BOOTSTRAP_ACTION_NOT_ELIGIBLE",
      next_step: "Revisar el historial de la acción Vercel en Owner Gate.",
      bootstrap: { id: bootstrapId, repository: `HockerAGI/${repositoryName}`,
        actions: [{ id: githubParent.id, action_type: "github.create_repository",
          status: githubParent.status },
        { id: vercelState.id, action_type: "vercel.create_project",
          status: vercelState.status, depends_on_action_id: githubParent.id }] },
    };
  }

  return {
    ...preview,
    version: NOVA_APPLICATION_DELIVERY_VERSION,
    materialized: true,
    enqueued: true,
    executed: false,
    owner_agi: "hostia",
    tool_key: "github",
    risk_level: "high",
    reason: "NOVA materializó una cadena de creación de aplicación: GitHub → Vercel. Ninguna acción se ejecutó desde chat.",
    current_limit: "La creación del repositorio debe ejecutarse primero. Vercel verifica la dependencia antes de crear el proyecto.",
    next_step: "Aprobar y ejecutar primero github.create_repository; después aprobar vercel.create_project; luego preparar código/CI/Preview.",
    bootstrap: {
      id: bootstrapId,
      repository: `HockerAGI/${repositoryName}`,
      vercel_project_name: projectName,
      actions: [
        {
          id: githubRow.id ?? null,
          action_type: "github.create_repository",
          status: githubRow.status ?? "needs_approval",
        },
        {
          id: vercelRow.id ?? null,
          action_type: "vercel.create_project",
          status: vercelRow.status ?? "needs_approval",
          depends_on_action_id: githubRow.id ?? null,
        },
      ],
      private_by_default: true,
      owner_gate_required: true,
    },
  };
}
