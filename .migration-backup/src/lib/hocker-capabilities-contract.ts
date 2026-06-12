import { getRuntimeToolCatalog, type RuntimeToolStatus } from "@/lib/agi-runtime-core";
import { AGI_REGISTRY, APP_REGISTRY } from "@/lib/hocker-dashboard";

export type HockerCapabilityStatus = "active" | "protected" | "partial" | "pending" | "blocked";
export type HockerCapabilityMode = "answer_now" | "read_now" | "prepare_only" | "owner_gate" | "blocked";

export type HockerCapabilityDefinition = {
  key: string;
  label: string;
  category:
    | "core"
    | "code"
    | "data"
    | "media"
    | "documents"
    | "research"
    | "ads"
    | "payments"
    | "cloud"
    | "security"
    | "chido"
    | "local_node"
    | "communication";
  owner_agi: string;
  support_agis: string[];
  app_key?: string;
  tool_keys: string[];
  base_status: HockerCapabilityStatus;
  mode: HockerCapabilityMode;
  requires_owner_gate: boolean;
  can_read: boolean;
  can_write: boolean;
  can_generate: boolean;
  can_execute_now: boolean;
  user_visible: boolean;
  current_limit: string;
  next_step: string;
};

export type HockerCapability = HockerCapabilityDefinition & {
  status: HockerCapabilityStatus;
  tool_statuses: Array<{
    tool_key: string;
    name: string;
    provider: string;
    status: string;
    execution_enabled: boolean;
    supports_read: boolean;
    supports_write: boolean;
  }>;
  evidence: string[];
  final_buttons: string[];
};

export type HockerCapabilitiesContract = {
  ok: true;
  version: "12.7E-1";
  generated_at: string;
  project_id: string;
  rules: {
    no_fake_integrations: true;
    no_direct_main_write: true;
    owner_gate_for_sensitive_actions: true;
    queue_lock_required: true;
    user_does_not_choose_agi: true;
    user_does_not_choose_model: true;
  };
  summary: {
    total: number;
    active: number;
    protected: number;
    partial: number;
    pending: number;
    blocked: number;
  };
  capabilities: HockerCapability[];
  public_context: {
    version: "12.7E-1";
    instruction: string;
    allowed_final_buttons: string[];
    capabilities: Array<{
      key: string;
      label: string;
      status: HockerCapabilityStatus;
      mode: HockerCapabilityMode;
      owner_agi: string;
      support_agis: string[];
      requires_owner_gate: boolean;
      can_execute_now: boolean;
      current_limit: string;
      next_step: string;
    }>;
  };
};

const FINAL_BUTTONS = ["Ver resumen", "Enviar a producción", "No enviar", "Deshacer"];

const CAPABILITY_DEFINITIONS: HockerCapabilityDefinition[] = [
  {
    key: "nova_native_chat",
    label: "Chat nativo NOVA",
    category: "core",
    owner_agi: "nova",
    support_agis: ["syntia", "vertx"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator", "gemini"],
    base_status: "active",
    mode: "answer_now",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: true,
    user_visible: true,
    current_limit: "Responde y razona. No ejecuta acciones productivas desde nova.agi.",
    next_step: "Mantener routing automático y mejorar memoria operacional.",
  },
  {
    key: "automatic_model_router",
    label: "Selección automática de modelo",
    category: "core",
    owner_agi: "nova",
    support_agis: ["numia"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator", "gemini", "openai"],
    base_status: "active",
    mode: "answer_now",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: true,
    user_visible: true,
    current_limit: "NOVA Railway opera con Gemini. Hocker ONE no ejecuta Gemini directo. OpenAI/Anthropic dependen de llave/crédito.",
    next_step: "Registrar salud real por proveedor sin mostrarlo como selector manual.",
  },
  {
    key: "automatic_agi_router",
    label: "Selección automática de AGI",
    category: "core",
    owner_agi: "nova",
    support_agis: ["syntia", "vertx", "hostia", "numia", "jurix", "nova_ads", "candy_ads", "pro_ia", "chido_gerente", "chido_wins"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator", "supabase"],
    base_status: "active",
    mode: "answer_now",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: true,
    user_visible: true,
    current_limit: "NOVA habla por fuera; las AGIs apoyan por dentro.",
    next_step: "Sincronizar contrato con nova.agi para que el prompt reciba capacidades por tarea.",
  },
  {
    key: "queue_lock_owner_gate",
    label: "Queue Lock + Owner Gate",
    category: "security",
    owner_agi: "vertx",
    support_agis: ["nova", "syntia"],
    app_key: "hocker-one",
    tool_keys: ["supabase", "github"],
    base_status: "protected",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Bloquea tareas nuevas si hay cola pendiente. La autorización final vive en Hocker ONE.",
    next_step: "Conservar como regla base antes de cualquier executor nuevo.",
  },
  {
    key: "repo_code_github",
    label: "Repos / código / GitHub",
    category: "code",
    owner_agi: "hostia",
    support_agis: ["vertx", "syntia"],
    app_key: "hocker-one",
    tool_keys: ["github"],
    base_status: "protected",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Lectura real y escritura por branch/PR con Owner Gate. Nunca main directo.",
    next_step: "Convertir el flujo de PR validado en capability formal reutilizable.",
  },
  {
    key: "supabase_memory_data",
    label: "Datos / Supabase / Syntia",
    category: "data",
    owner_agi: "syntia",
    support_agis: ["vertx", "nova"],
    app_key: "hocker-one",
    tool_keys: ["supabase"],
    base_status: "protected",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Lectura/estado y memoria operativa. Escritura productiva requiere executor separado.",
    next_step: "12.7F debe convertir memoria operacional en capa estable.",
  },
  {
    key: "file_import_analysis",
    label: "Importar archivos",
    category: "documents",
    owner_agi: "syntia",
    support_agis: ["vertx"],
    app_key: "hocker-one",
    tool_keys: ["supabase"],
    base_status: "pending",
    mode: "prepare_only",
    requires_owner_gate: true,
    can_read: false,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "La UI lo muestra como pendiente. Falta uploader seguro y parser real para PDF/DOC/CSV/ZIP.",
    next_step: "Crear pipeline de carga segura con límites, escaneo y trazabilidad.",
  },
  {
    key: "image_generation",
    label: "Generar imágenes",
    category: "media",
    owner_agi: "candy_ads",
    support_agis: ["nova_ads", "vertx"],
    app_key: "hocker-ads",
    tool_keys: ["openai", "gemini"],
    base_status: "pending",
    mode: "prepare_only",
    requires_owner_gate: false,
    can_read: false,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Candy Ads puede preparar prompts y dirección visual. Falta executor visual conectado en Hocker ONE.",
    next_step: "Conectar proveedor visual real sin fingir generación desde el chat.",
  },
  {
    key: "video_generation",
    label: "Generar video / avatar",
    category: "media",
    owner_agi: "pro_ia",
    support_agis: ["candy_ads", "nova_ads", "vertx"],
    app_key: "hocker-ads",
    tool_keys: ["heygen"],
    base_status: "pending",
    mode: "prepare_only",
    requires_owner_gate: true,
    can_read: false,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "PRO IA puede preparar guion/storyboard. HeyGen todavía debe validarse como integración real.",
    next_step: "Conectar HeyGen con Owner Gate y evidencia de job.",
  },
  {
    key: "document_generation",
    label: "Documentos ejecutivos",
    category: "documents",
    owner_agi: "syntia",
    support_agis: ["candy_ads", "jurix"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator"],
    base_status: "partial",
    mode: "prepare_only",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede preparar contenido en chat. Export PDF/DOCX queda como executor futuro.",
    next_step: "Agregar exportadores seguros y plantillas HOCKER.",
  },
  {
    key: "presentation_generation",
    label: "Presentaciones",
    category: "documents",
    owner_agi: "candy_ads",
    support_agis: ["syntia", "nova_ads"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator"],
    base_status: "partial",
    mode: "prepare_only",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede preparar estructura de slides. Export PPTX/Slides queda pendiente.",
    next_step: "Crear generador/exportador de decks con branding.",
  },
  {
    key: "deep_research",
    label: "Investigación profunda",
    category: "research",
    owner_agi: "curvewind",
    support_agis: ["syntia", "jurix", "numia"],
    app_key: "hocker-one",
    tool_keys: ["nova_orchestrator", "github"],
    base_status: "partial",
    mode: "prepare_only",
    requires_owner_gate: false,
    can_read: true,
    can_write: false,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede investigar repos y contexto interno. Investigación web con citas requiere pipeline separado.",
    next_step: "Crear research pipeline con fuentes, citas, snapshots y memoria Syntia.",
  },
  {
    key: "ads_campaigns",
    label: "Campañas Ads",
    category: "ads",
    owner_agi: "nova_ads",
    support_agis: ["candy_ads", "numia", "jurix"],
    app_key: "hocker-ads",
    tool_keys: ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads"],
    base_status: "pending",
    mode: "prepare_only",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede crear estrategia, copys y funnel. Publicación real de campañas requiere llaves/executor.",
    next_step: "Conectar reportes primero; escritura de campañas después con Owner Gate.",
  },
  {
    key: "chido_monitoring",
    label: "Chido Casino monitoreo",
    category: "chido",
    owner_agi: "chido_gerente",
    support_agis: ["vertx", "jurix", "numia", "chido_wins"],
    app_key: "chido-casino",
    tool_keys: ["supabase", "d24"],
    base_status: "protected",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: false,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Chido es sensible: pagos, KYC, wallet y juegos no deben mezclarse con ejecución automática.",
    next_step: "Solo monitoreo y preflight hasta cerrar gates legales/financieros.",
  },
  {
    key: "chido_sensitive_ops",
    label: "Chido operaciones sensibles",
    category: "chido",
    owner_agi: "chido_gerente",
    support_agis: ["jurix", "vertx", "numia", "chido_wins"],
    app_key: "chido-casino",
    tool_keys: ["supabase", "d24", "paypal"],
    base_status: "blocked",
    mode: "blocked",
    requires_owner_gate: true,
    can_read: false,
    can_write: false,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Bloqueado para ejecución productiva: KYC, retiros, wallet, apuestas y pagos requieren fase separada.",
    next_step: "Diseñar compliance gate específico para Chido antes de cualquier executor.",
  },
  {
    key: "hocker_node_agent",
    label: "Nodo local / command runner",
    category: "local_node",
    owner_agi: "hostia",
    support_agis: ["vertx"],
    app_key: "hocker-one",
    tool_keys: ["supabase"],
    base_status: "protected",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: false,
    can_execute_now: false,
    user_visible: false,
    current_limit: "Existe agente local con sandbox/firma. No se mezcla todavía con NOVA Chat productivo.",
    next_step: "Fase futura: command/test runner seguro con límites estrictos.",
  },
  {
    key: "payments_wallet",
    label: "Pagos / Wallet",
    category: "payments",
    owner_agi: "numia",
    support_agis: ["jurix", "vertx"],
    app_key: "chido-casino",
    tool_keys: ["stripe", "paypal", "d24"],
    base_status: "blocked",
    mode: "blocked",
    requires_owner_gate: true,
    can_read: false,
    can_write: false,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "No ejecutar pagos/retiros desde NOVA. Requiere compliance, auditoría financiera y doble aprobación.",
    next_step: "Crear Payment Gate separado con simulación, revisión y auditoría.",
  },
  {
    key: "domains_cloud_ops",
    label: "Dominios / Cloud / DNS",
    category: "cloud",
    owner_agi: "hostia",
    support_agis: ["vertx", "jurix"],
    app_key: "hocker-one",
    tool_keys: ["namecheap", "cloudflare", "hetzner", "vercel"],
    base_status: "partial",
    mode: "owner_gate",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: false,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede preparar diagnóstico/plan. Cambios reales requieren executor y Owner Gate.",
    next_step: "Conectar primero lectura de DNS/deploys; escritura después.",
  },
  {
    key: "email_notifications",
    label: "Email / notificaciones",
    category: "communication",
    owner_agi: "revia",
    support_agis: ["jurix", "vertx"],
    app_key: "hocker-hub",
    tool_keys: ["email"],
    base_status: "pending",
    mode: "prepare_only",
    requires_owner_gate: true,
    can_read: true,
    can_write: true,
    can_generate: true,
    can_execute_now: false,
    user_visible: true,
    current_limit: "Puede redactar mensajes. Envío real requiere proveedor conectado y consentimiento.",
    next_step: "Conectar proveedor transaccional con logs y opt-out.",
  },
];

function toolMap(tools: RuntimeToolStatus[]) {
  return new Map(tools.map((tool) => [tool.tool_key, tool]));
}

function statusRank(status: HockerCapabilityStatus): number {
  return { active: 5, protected: 4, partial: 3, pending: 2, blocked: 1 }[status];
}

function statusFromTools(definition: HockerCapabilityDefinition, tools: RuntimeToolStatus[]): HockerCapabilityStatus {
  if (definition.base_status === "blocked" || definition.base_status === "pending") return definition.base_status;

  if (tools.length === 0) return definition.base_status;

  const hasExecutor = tools.some((tool) => tool.execution_enabled);
  const hasConnected = tools.some((tool) => tool.status === "connected" || tool.status === "configured");
  const hasPartial = tools.some((tool) => tool.status === "partial" || tool.status === "missing_code");
  const allMissing = tools.every((tool) => tool.status === "missing_key" || tool.status === "missing" || tool.status === "blocked");

  if (definition.requires_owner_gate && hasExecutor) return "protected";
  if (!definition.requires_owner_gate && (hasConnected || hasExecutor)) return "active";
  if (hasConnected || hasPartial || hasExecutor) return statusRank(definition.base_status) >= statusRank("partial") ? definition.base_status : "partial";
  if (allMissing) return definition.base_status === "active" ? "partial" : definition.base_status;

  return definition.base_status;
}

function buildCapability(definition: HockerCapabilityDefinition, toolsByKey: Map<string, RuntimeToolStatus>): HockerCapability {
  const toolStatuses = definition.tool_keys
    .map((key) => toolsByKey.get(key))
    .filter((tool): tool is RuntimeToolStatus => Boolean(tool));

  const status = statusFromTools(definition, toolStatuses);
  const evidence = [
    `owner_agi:${definition.owner_agi}`,
    `mode:${definition.mode}`,
    `owner_gate:${definition.requires_owner_gate}`,
    ...toolStatuses.map((tool) => `${tool.tool_key}:${tool.status}${tool.execution_enabled ? ":executor" : ""}`),
  ];

  return {
    ...definition,
    status,
    tool_statuses: toolStatuses.map((tool) => ({
      tool_key: tool.tool_key,
      name: tool.name,
      provider: tool.provider,
      status: tool.status,
      execution_enabled: tool.execution_enabled,
      supports_read: tool.supports_read,
      supports_write: tool.supports_write,
    })),
    evidence,
    final_buttons: definition.requires_owner_gate || definition.mode === "owner_gate" ? FINAL_BUTTONS : [],
  };
}

function countByStatus(capabilities: HockerCapability[]) {
  return capabilities.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    { total: 0, active: 0, protected: 0, partial: 0, pending: 0, blocked: 0 },
  );
}

export function getHockerCapabilitiesContract(project_id = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"): HockerCapabilitiesContract {
  const tools = getRuntimeToolCatalog();
  const toolsByKey = toolMap(tools);
  const capabilities = CAPABILITY_DEFINITIONS.map((definition) => buildCapability(definition, toolsByKey));

  return {
    ok: true,
    version: "12.7E-1",
    generated_at: new Date().toISOString(),
    project_id,
    rules: {
      no_fake_integrations: true,
      no_direct_main_write: true,
      owner_gate_for_sensitive_actions: true,
      queue_lock_required: true,
      user_does_not_choose_agi: true,
      user_does_not_choose_model: true,
    },
    summary: countByStatus(capabilities),
    capabilities,
    public_context: {
      version: "12.7E-1",
      instruction:
        "Usa este contrato antes de prometer capacidades. Si una capacidad está pending/blocked/partial, dilo claro y prepara solo plan seguro. No ejecutes acciones productivas fuera de Hocker ONE.",
      allowed_final_buttons: FINAL_BUTTONS,
      capabilities: capabilities
        .filter((capability) => capability.user_visible)
        .map((capability) => ({
          key: capability.key,
          label: capability.label,
          status: capability.status,
          mode: capability.mode,
          owner_agi: capability.owner_agi,
          support_agis: capability.support_agis,
          requires_owner_gate: capability.requires_owner_gate,
          can_execute_now: capability.can_execute_now,
          current_limit: capability.current_limit,
          next_step: capability.next_step,
        })),
    },
  };
}

export function getCapabilityRegistrySnapshot() {
  return {
    apps: APP_REGISTRY.map((app) => ({ key: app.key, title: app.title, status: app.status, group: app.group })),
    agis: AGI_REGISTRY.map((agi) => ({ key: agi.key, title: agi.title, status: agi.status, group: agi.group })),
  };
}
