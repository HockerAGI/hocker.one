/**
 * Hocker ONE — Nova Chat Types & Constants
 *
 * Shared types, constants, and capability definitions for the
 * NovaRealtimeChat component tree. Extracted from the monolith
 * for maintainability (FE-01).
 */

export type ChatActionDraft = {
  version?: string;
  requested?: boolean;
  enqueued?: boolean;
  executed?: boolean;
  project_id?: string;
  scope?: string;
  tool_key?: string | null;
  owner_agi?: string;
  risk_level?: string;
  can_enqueue?: boolean;
  reason?: string;
  current_limit?: string;
  next_step?: string;
  draft?: {
    title?: string;
    original_message?: string;
    action_policy?: string;
    execution_ready?: boolean;
    owner_gate_required?: boolean;
    queue_lock_checked?: boolean;
    proposed_flow?: string[];
  };
  public_context?: Record<string, unknown>;
};

export type Msg = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  actions?: ChatActionDraft[];
  meta?: Record<string, unknown> | null;
};

export type Integration = {
  tool_key: string;
  name: string;
  provider: string;
  status: "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  safe_note?: string;
};

export type RuntimeAction = {
  id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string;
  created_at: string;
  execution_error?: string | null;
  payload?: Record<string, unknown>;
  execution_result?: Record<string, unknown> | null;
};

export type QueueLock = {
  locked: boolean;
  can_start_new_task: boolean;
  reason: string;
  blocking_count: number;
  total_recent: number;
  active_actions: RuntimeAction[];
  status_counts: Record<string, number>;
  checked_at: string;
  error?: string;
};

export type RuntimeSummary = {
  counts?: { agents: number; tools_configured: number; tools_total: number; actions: number; runs: number };
  integrations?: Integration[];
  schema_ready?: boolean;
  message?: string;
};

export type NativeCapability = {
  key: string;
  label: string;
  status: "Activo" | "Protegido" | "Parcial" | "Pendiente";
  detail: string;
  prompt: string;
};

export type CapabilityGroup = {
  key: "crear" | "trabajo" | "sistema";
  title: string;
  label: string;
  name: string;
  subtitle: string;
  description: string;
  items: NativeCapability[];
  capabilities: NativeCapability[];
  tools: NativeCapability[];
  keys: string[];
};

export type GuidedGitHubChain = {
  key: string;
  targetBranch: string;
  actions: RuntimeAction[];
  nextAction: RuntimeAction | null;
  completed: number;
  total: number;
};

export type ActionListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
export type MutateResponse = { ok?: boolean; message?: string; error?: string };

export const BLOCKING_STATUSES = new Set([
  "needs_approval",
  "approved",
  "queued",
  "dry_run_queued",
  "running",
  "executing",
  "execution_failed",
  "failed",
  "error",
  "needs_fix",
  "review",
]);

export const GUIDED_GITHUB_ACTION_ORDER = ["github.create_branch", "github.upsert_file", "github.create_pr"];
export const GUIDED_GITHUB_TERMINAL_STATUSES = new Set(["executed", "completed", "rejected", "cancelled", "canceled"]);

export const NATIVE_CAPABILITIES: NativeCapability[] = [
  {
    key: "archivo",
    label: "Archivos",
    status: "Pendiente",
    detail: "PDF, DOC, CSV, ZIP e importación segura. Falta subir archivos desde Hocker ONE.",
    prompt: "NOVA, quiero importar un archivo. Dime cómo lo vas a procesar sin exponer datos sensibles.",
  },
  {
    key: "imagen",
    label: "Imagen",
    status: "Pendiente",
    detail: "Candy Ads será responsable. Falta executor visual real conectado a Hocker ONE.",
    prompt: "NOVA, prepara una solicitud de imagen para Candy Ads con branding Hocker.",
  },
  {
    key: "video",
    label: "Video",
    status: "Pendiente",
    detail: "PRO IA será responsable. HeyGen/video requiere integración validada.",
    prompt: "NOVA, prepara un guion y storyboard de video para PRO IA.",
  },
  {
    key: "voz",
    label: "Voz",
    status: "Pendiente",
    detail: "Texto a voz y clonación de voz requieren integración real y permisos.",
    prompt: "NOVA, prepara un flujo de voz para el ecosistema y dime qué falta conectar.",
  },
  {
    key: "avatar",
    label: "Avatar",
    status: "Pendiente",
    detail: "Avatar y humanoide NOVA requieren pipeline visual/video validado.",
    prompt: "NOVA, prepara el flujo para avatar de NOVA sin fingir generación.",
  },
  {
    key: "documento",
    label: "Documentos",
    status: "Pendiente",
    detail: "Puede estructurar contenido. Exportación PDF/DOCX queda como siguiente módulo.",
    prompt: "NOVA, prepara un documento ejecutivo listo para exportar.",
  },
  {
    key: "presentacion",
    label: "Slides",
    status: "Pendiente",
    detail: "Presentaciones exportables quedan pendientes de generador real.",
    prompt: "NOVA, prepara una presentación ejecutiva estilo Hocker ONE.",
  },
  {
    key: "repo",
    label: "Código",
    status: "Protegido",
    detail: "GitHub real protegido. Branch/PR/Owner Gate. Nunca main directo.",
    prompt: "NOVA, revisa el repo y prepara una mejora sin ejecutar nada.",
  },
  {
    key: "investigacion",
    label: "Research",
    status: "Parcial",
    detail: "Puede preparar análisis. Investigación profunda con citas entra en módulo dedicado.",
    prompt: "NOVA, investiga este tema con fuentes verificables y separa hechos de recomendaciones.",
  },
  {
    key: "datos",
    label: "Datos",
    status: "Protegido",
    detail: "Supabase lectura/estado. Escritura solo con Owner Gate.",
    prompt: "NOVA, revisa el estado de Supabase sin cambiar datos.",
  },
];
