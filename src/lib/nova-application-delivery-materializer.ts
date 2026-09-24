import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { hasGitHubRuntimeToken } from "@/lib/github-runtime-executor";
import { hasVercelRuntimeToken, verifyVercelConnection } from "@/lib/vercel-runtime-executor";
import { buildNovaChatActionDraftPreview } from "@/lib/nova-chat-action-drafts";

export const NOVA_APPLICATION_DELIVERY_VERSION = "12.8A-1";

type QueueLockLike = {
  locked?: boolean;
  can_start_new_task?: boolean;
  reason?: string;
  blocking_count?: number;
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

  if (!preview || preview.scope !== "application_delivery" || !preview.can_enqueue) {
    return preview;
  }

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

  const bootstrapId = `bootstrap_${Date.now()}_${slug(params.message)}`;
  const repositoryName = `app-${slug(params.message)}`;
  const projectName = repositoryName;
  const github = await enqueueGitHubRepository({
    project_id: params.project_id,
    created_by: params.created_by,
    name: repositoryName,
    bootstrap_id: bootstrapId,
  });
  const githubRow = github as Record<string, unknown>;

  const vercel = await enqueueVercelProject({
    project_id: params.project_id,
    created_by: params.created_by,
    projectName,
    repository: `HockerAGI/${repositoryName}`,
    bootstrap_id: bootstrapId,
    depends_on_action_id: String(githubRow.id ?? ""),
  });
  const vercelRow = vercel as Record<string, unknown>;

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
