import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { getGitHubRuntimeToken } from "@/lib/github-runtime-executor";
import {
  buildNovaChatActionDraftPreview,
  getNovaChatActionDraftPublicContext,
} from "@/lib/nova-chat-action-drafts";

export const NOVA_GITHUB_ACTION_MATERIALIZER_VERSION = "12.7K-2A";

type QueueLockLike = {
  locked?: boolean;
  can_start_new_task?: boolean;
  reason?: string;
  blocking_count?: number;
};

type GitHubOperation = "create_branch" | "upsert_file" | "create_pr";
type JsonRecord = Record<string, unknown>;

function compact(value: unknown, max = 420): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function slug(value: unknown): string {
  const clean = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return clean || "nova-chat-action";
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").toLowerCase();
}

function defaultRepository(): string {
  return String(process.env.HOCKER_GITHUB_REPO || process.env.GITHUB_REPOSITORY || "HockerAGI/hocker.one").trim();
}

function planContent(params: {
  message: string;
  repository: string;
  branch: string;
  path: string;
}) {
  return [
    "# NOVA Chat · GitHub Action Materialization",
    "",
    "## Solicitud original",
    "",
    params.message,
    "",
    "## Estado real",
    "",
    "- Generado desde NOVA Chat.",
    "- Responsable operativo: HOSTIA.",
    "- Supervisión: NOVA + VERTX.",
    "- Ejecución real: pendiente de aprobación Owner Gate.",
    "- Escritura directa a main: bloqueada.",
    "",
    "## Plan materializado",
    "",
    `- Repositorio: ${params.repository}`,
    `- Rama propuesta: ${params.branch}`,
    `- Archivo de evidencia: ${params.path}`,
    "- PR: draft protegido.",
    "",
    "## Flujo",
    "",
    "1. Owner revisa acciones en Hocker ONE.",
    "2. Owner aprueba create_branch.",
    "3. Worker GitHub crea rama protegida.",
    "4. Owner aprueba upsert_file.",
    "5. Worker GitHub guarda evidencia.",
    "6. Owner aprueba create_pr.",
    "7. Worker GitHub abre PR draft.",
    "8. Resultado, error o rollback queda registrado.",
    "",
    "## Política",
    "",
    "- No simulaciones.",
    "- No ejecución oculta.",
    "- No main directo.",
    "- No secretos en contenido.",
    "- Toda acción queda en cola y auditada.",
    "",
    `Generado: ${new Date().toISOString()}`,
    "",
  ].join("\n");
}

export function getNovaGitHubActionMaterializerPublicContext() {
  return {
    version: NOVA_GITHUB_ACTION_MATERIALIZER_VERSION,
    status: "active",
    mode: "nova_chat_to_github_queue_materializer",
    source: "hocker-one",
    rules: {
      nova_speaks_to_owner: true,
      hostia_executes_github_scope: true,
      creates_real_queue_actions: true,
      creates_branch_action: true,
      creates_upsert_file_action: true,
      creates_pr_action: true,
      no_direct_execution_from_chat: true,
      owner_gate_required: true,
      no_main_direct_write: true,
      no_fake_integrations: true,
      rollback_required: true,
    },
    supported_operations: ["github.create_branch", "github.upsert_file", "github.create_pr"],
    next_step: "12.7K-2B debe guiar aprobación/ejecución por pasos y mostrar evidencia visual por acción.",
  };
}

function payloadFor(operation: GitHubOperation, params: {
  repository: string;
  branch: string;
  path: string;
  content: string;
  message: string;
}): JsonRecord {
  if (operation === "create_branch") {
    return {
      repository: params.repository,
      base: "main",
      base_branch: "main",
      branch: params.branch,
      target_branch: params.branch,
      message: `NOVA create ${params.branch}`,
    };
  }

  if (operation === "upsert_file") {
    return {
      repository: params.repository,
      base: "main",
      base_branch: "main",
      branch: params.branch,
      target_branch: params.branch,
      path: params.path,
      content: params.content,
      message: "docs: add NOVA materialized action plan",
    };
  }

  return {
    repository: params.repository,
    base: "main",
    base_branch: "main",
    head: params.branch,
    branch: params.branch,
    target_branch: params.branch,
    title: `NOVA Chat materialized action: ${compact(params.message, 72)}`,
    body: [
      "PR draft generado desde NOVA Chat bajo Owner Gate.",
      "",
      "No fue creado directamente en main.",
      "No ejecuta cambios ocultos.",
      "La evidencia del plan queda en el archivo generado por NOVA.",
      "",
      `Solicitud original: ${params.message}`,
    ].join("\n"),
  };
}

async function enqueueOperation(params: {
  project_id: string;
  created_by: string;
  operation: GitHubOperation;
  payload: JsonRecord;
}) {
  const risk = params.operation === "create_pr" ? "medium" : "high";

  const item = await enqueueAgiAction({
    project_id: params.project_id,
    agi_id: "hostia",
    tool_key: "github",
    action_type: `github.${params.operation}`,
    title:
      params.operation === "create_branch"
        ? "HOSTIA · Crear rama segura"
        : params.operation === "upsert_file"
          ? "HOSTIA · Guardar evidencia del plan"
          : "HOSTIA · Abrir PR draft",
    payload: {
      ...params.payload,
      source: "nova_chat_github_materializer",
      materializer_version: NOVA_GITHUB_ACTION_MATERIALIZER_VERSION,
      safety: {
        executed_now: false,
        owner_gate_required: true,
        no_direct_execution_from_chat: true,
        no_main_direct_write: true,
      },
    },
    risk_level: risk,
    dry_run: true,
    requires_approval: true,
    created_by: params.created_by,
  });

  const row = item as Record<string, unknown>;

  return {
    id: row.id ?? null,
    status: row.status ?? "needs_approval",
    tool_key: row.tool_key ?? "github",
    action_type: row.action_type ?? `github.${params.operation}`,
    title: row.title ?? `GitHub ${params.operation}`,
    risk_level: row.risk_level ?? risk,
    operation: params.operation,
  };
}

export async function materializeNovaGitHubActionsFromChat(params: {
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

  if (!preview) return null;

  if (preview.scope !== "github_code" || !preview.can_enqueue) {
    return {
      ...preview,
      materialized: false,
      enqueued: false,
      executed: false,
      materializer: getNovaGitHubActionMaterializerPublicContext(),
    };
  }

  if (!getGitHubRuntimeToken()) {
    return {
      ...preview,
      materialized: false,
      enqueued: false,
      executed: false,
      can_enqueue: false,
      reason: "GitHub no está configurado. Falta token real para materializar acciones.",
      materializer: getNovaGitHubActionMaterializerPublicContext(),
    };
  }

  const repository = defaultRepository();
  const safeSlug = slug(params.message);
  const baseStamp = stamp();
  const branch = `nova/chat-${baseStamp}-${safeSlug}`.slice(0, 92);
  const path = `docs/nova-action-drafts/${baseStamp}-${safeSlug}.md`;
  const content = planContent({
    message: compact(params.message, 1800),
    repository,
    branch,
    path,
  });

  const operations: GitHubOperation[] = ["create_branch", "upsert_file", "create_pr"];
  const materializedActions = [];

  for (const operation of operations) {
    materializedActions.push(
      await enqueueOperation({
        project_id: params.project_id,
        created_by: params.created_by,
        operation,
        payload: payloadFor(operation, {
          repository,
          branch,
          path,
          content,
          message: params.message,
        }),
      }),
    );
  }

  return {
    ...preview,
    version: NOVA_GITHUB_ACTION_MATERIALIZER_VERSION,
    materialized: true,
    enqueued: true,
    executed: false,
    project_id: params.project_id,
    scope: "github_code",
    tool_key: "github",
    owner_agi: "hostia",
    risk_level: "high",
    reason: "NOVA materializó la solicitud en acciones GitHub reales protegidas. No ejecutó nada.",
    current_limit: "Las acciones quedaron en needs_approval. El Owner debe aprobar y ejecutar por pasos.",
    next_step: "Aprobar create_branch, upsert_file y create_pr desde Hocker ONE.",
    materialized_plan: {
      repository,
      base_branch: "main",
      target_branch: branch,
      evidence_path: path,
      operations,
      direct_main_write: false,
      owner_gate_required: true,
    },
    materialized_actions: materializedActions,
    message: "Acciones GitHub materializadas en cola segura. No se ejecutó nada.",
    public_context: {
      action_drafts: getNovaChatActionDraftPublicContext(),
      github_materializer: getNovaGitHubActionMaterializerPublicContext(),
    },
  };
}
