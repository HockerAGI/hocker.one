import { enqueueAgiAction } from "@/lib/agi-runtime-core";

export const NOVA_CHAT_ACTION_DRAFT_VERSION = "12.7J-1";

type QueueLockLike = {
  locked?: boolean;
  can_start_new_task?: boolean;
  reason?: string;
  blocking_count?: number;
};

type DraftScope =
  | "github_code"
  | "supabase_data"
  | "vercel_cloud"
  | "terminal_local"
  | "ads_marketing"
  | "chido_sensitive"
  | "general_action";

type DraftDecision = {
  requested: boolean;
  scope: DraftScope;
  can_enqueue: boolean;
  tool_key: string | null;
  owner_agi: string;
  risk_level: "low" | "medium" | "high" | "critical";
  reason: string;
  current_limit: string;
  next_step: string;
};

function compact(value: unknown, max = 420): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function hasAny(message: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(message));
}

function detectScope(message: string): DraftScope {
  if (hasAny(message, [/chido/i, /kyc/i, /retiro/i, /dep[oó]sito/i, /wallet/i, /apuesta/i, /pago/i, /casino/i])) return "chido_sensitive";
  if (hasAny(message, [/github/i, /\brepo\b/i, /repositorio/i, /c[oó]digo/i, /\bbranch\b/i, /\brama\b/i, /\bpr\b/i, /pull request/i, /commit/i, /archivo/i, /\.tsx\b/i, /\.ts\b/i, /componente/i, /endpoint/i])) return "github_code";
  if (hasAny(message, [/supabase/i, /base de datos/i, /\bdb\b/i, /tabla/i, /memoria/i, /registro/i])) return "supabase_data";
  if (hasAny(message, [/vercel/i, /deploy/i, /despliegue/i, /producci[oó]n/i, /dominio/i])) return "vercel_cloud";
  if (hasAny(message, [/terminal/i, /termux/i, /servidor/i, /shell/i, /comando/i, /zip/i])) return "terminal_local";
  if (hasAny(message, [/meta ads/i, /facebook ads/i, /google ads/i, /tiktok/i, /campaña/i, /anuncio/i, /ads/i])) return "ads_marketing";
  return "general_action";
}

export function getNovaChatActionDraftPublicContext() {
  return {
    version: NOVA_CHAT_ACTION_DRAFT_VERSION,
    status: "active",
    mode: "chat_to_safe_action_drafts",
    source: "hocker-one",
    rules: {
      natural_language_action_detection: true,
      drafts_only_from_chat: true,
      no_direct_execution_from_chat: true,
      owner_gate_required_for_execution: true,
      queue_lock_required: true,
      github_first_executor: true,
      non_validated_integrations_prepare_only: true,
      no_main_direct_write: true,
      no_fake_integrations: true,
    },
    supported_now: {
      github_code: "Crea borrador seguro en cola. La ejecución real sigue por Owner Gate.",
    },
    prepare_only_now: [
      "supabase_data",
      "vercel_cloud",
      "terminal_local",
      "ads_marketing",
      "general_action",
    ],
    blocked_now: [
      "chido_sensitive",
    ],
    next_step: "12.7J-2 debe materializar borradores GitHub en acciones concretas create_branch/upsert_file/create_pr cuando haya plan completo.",
  };
}

export function detectNovaChatActionDraft(message: string, queueLock?: QueueLockLike | null): DraftDecision {
  const clean = String(message || "").trim();

  const actionRequested = hasAny(clean, [
    /haz/i,
    /hacer/i,
    /crea/i,
    /crear/i,
    /prepara/i,
    /preparar/i,
    /corrige/i,
    /corregir/i,
    /modifica/i,
    /modificar/i,
    /actualiza/i,
    /actualizar/i,
    /implementa/i,
    /implementar/i,
    /ejecuta/i,
    /ejecutar/i,
    /revisa/i,
    /revisar/i,
    /conecta/i,
    /conectar/i,
    /despliega/i,
    /desplegar/i,
    /genera/i,
    /generar/i,
  ]);

  const scope = detectScope(clean);
  const queueBlocked = Boolean(queueLock?.locked || queueLock?.can_start_new_task === false);

  if (!actionRequested) {
    return {
      requested: false,
      scope,
      can_enqueue: false,
      tool_key: null,
      owner_agi: "nova",
      risk_level: "low",
      reason: "No parece una solicitud de acción real.",
      current_limit: "NOVA responde normal.",
      next_step: "Responder sin crear borrador.",
    };
  }

  if (queueBlocked) {
    return {
      requested: true,
      scope,
      can_enqueue: false,
      tool_key: scope === "github_code" ? "github" : null,
      owner_agi: scope === "github_code" ? "hostia" : "nova",
      risk_level: "medium",
      reason: queueLock?.reason || "Queue Lock activo: hay trabajo pendiente.",
      current_limit: "No se crea una tarea nueva mientras exista cola bloqueante.",
      next_step: "Terminar, rechazar o limpiar la tarea pendiente antes de crear otra.",
    };
  }

  if (scope === "chido_sensitive") {
    return {
      requested: true,
      scope,
      can_enqueue: false,
      tool_key: null,
      owner_agi: "chido_gerente",
      risk_level: "critical",
      reason: "Operación sensible de Chido bloqueada.",
      current_limit: "KYC, depósitos, retiros, wallet, pagos y apuestas no se ejecutan desde chat.",
      next_step: "Usar gates legales/financieros específicos antes de cualquier executor.",
    };
  }

  if (scope === "github_code") {
    return {
      requested: true,
      scope,
      can_enqueue: true,
      tool_key: "github",
      owner_agi: "hostia",
      risk_level: "medium",
      reason: "Solicitud de repo/código detectada. GitHub es el primer executor real protegido.",
      current_limit: "12.7J-1 crea borrador seguro. No ejecuta branch, archivo ni PR todavía desde chat.",
      next_step: "Materializar el borrador en acciones GitHub concretas con Owner Gate.",
    };
  }

  return {
    requested: true,
    scope,
    can_enqueue: false,
    tool_key: null,
    owner_agi: "nova",
    risk_level: "medium",
    reason: "La solicitud pide acción, pero esa integración todavía no tiene executor validado desde NOVA Chat.",
    current_limit: "Solo se prepara plan seguro. No se finge ejecución.",
    next_step: "Crear executor real específico para esta integración antes de permitir cola ejecutable.",
  };
}

export function buildNovaChatActionDraftPreview(params: {
  project_id: string;
  message: string;
  queue_lock?: QueueLockLike | null;
}) {
  const decision = detectNovaChatActionDraft(params.message, params.queue_lock);
  if (!decision.requested) return null;

  return {
    version: NOVA_CHAT_ACTION_DRAFT_VERSION,
    requested: true,
    enqueued: false,
    executed: false,
    project_id: params.project_id,
    scope: decision.scope,
    tool_key: decision.tool_key,
    owner_agi: decision.owner_agi,
    risk_level: decision.risk_level,
    can_enqueue: decision.can_enqueue,
    reason: decision.reason,
    current_limit: decision.current_limit,
    next_step: decision.next_step,
    draft: {
      title: `NOVA Chat draft: ${compact(params.message, 90)}`,
      original_message: compact(params.message, 1400),
      action_policy: "draft_only_no_direct_execution",
      execution_ready: false,
      owner_gate_required: true,
      queue_lock_checked: true,
      proposed_flow: [
        "Leer contexto real del proyecto.",
        "Preparar plan técnico exacto.",
        "Convertir a acciones específicas solo si el executor existe.",
        "Pedir autorización owner antes de ejecutar.",
        "Guardar evidencia, resultado y rollback.",
      ],
    },
    public_context: getNovaChatActionDraftPublicContext(),
  };
}

export async function enqueueNovaChatActionDraft(params: {
  project_id: string;
  message: string;
  queue_lock?: QueueLockLike | null;
  created_by: string;
}) {
  const preview = buildNovaChatActionDraftPreview(params);
  if (!preview) return null;

  if (!preview.can_enqueue) {
    return preview;
  }

  const item = await enqueueAgiAction({
    project_id: params.project_id,
    agi_id: preview.owner_agi,
    tool_key: preview.tool_key,
    action_type: "nova.chat_action_draft",
    title: preview.draft.title,
    payload: {
      ...preview.draft,
      version: NOVA_CHAT_ACTION_DRAFT_VERSION,
      scope: preview.scope,
      tool_key: preview.tool_key,
      source: "nova_chat",
      executor_mode: "draft_only",
      can_execute_now: false,
      materialization_required: true,
      materialization_target: preview.scope === "github_code" ? "github.write_gate_plan" : "prepare_only",
      safety: {
        executed_now: false,
        writes_planned_now: false,
        no_direct_execution_from_chat: true,
        owner_gate_required: true,
        no_main_direct_write: true,
      },
    },
    risk_level: preview.risk_level,
    dry_run: true,
    requires_approval: true,
    created_by: params.created_by,
  });

  const itemRecord = item as Record<string, unknown>;

  return {
    ...preview,
    enqueued: true,
    item: {
      id: itemRecord.id ?? null,
      status: itemRecord.status ?? "needs_approval",
      tool_key: itemRecord.tool_key ?? preview.tool_key,
      action_type: itemRecord.action_type ?? "nova.chat_action_draft",
      title: itemRecord.title ?? preview.draft.title,
      risk_level: itemRecord.risk_level ?? preview.risk_level,
    },
    message: "Borrador seguro creado desde NOVA Chat. No se ejecutó nada.",
  };
}
