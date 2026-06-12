import { getHockerCapabilitiesContract, type HockerCapability, type HockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";

export type HockerToolRouteDecision = {
  ok: true;
  message: string;
  capability_key: string;
  capability_label: string;
  owner_agi: string;
  support_agis: string[];
  status: string;
  mode: string;
  requires_owner_gate: boolean;
  can_execute_now: boolean;
  should_show_final_buttons: boolean;
  final_buttons: string[];
  reason: string;
  next_step: string;
};

const ROUTES: Array<{ key: string; patterns: RegExp[]; reason: string }> = [
  { key: "image_generation", reason: "La solicitud pide imagen/visual creativo.", patterns: [/im[aá]gen|im[aá]genes|foto|visual|diseño|logo|wallpaper|fondo/i] },
  { key: "video_generation", reason: "La solicitud pide video, avatar, reels o producción audiovisual.", patterns: [/video|avatar|heygen|reel|storyboard|guion audiovisual/i] },
  { key: "document_generation", reason: "La solicitud pide documento, PDF, contrato, ficha o reporte.", patterns: [/documento|pdf|docx|reporte|ficha|contrato|manual/i] },
  { key: "presentation_generation", reason: "La solicitud pide presentación o slides.", patterns: [/presentaci[oó]n|slides|pptx|deck|diapositivas/i] },
  { key: "file_import_analysis", reason: "La solicitud pide importar o analizar archivos.", patterns: [/archivo|subir|importar|csv|zip|excel|xlsx|doc|pdf/i] },
  { key: "repo_code_github", reason: "La solicitud involucra repositorios, código, GitHub, PR o deploy.", patterns: [/repo|repositorio|github|c[oó]digo|commit|branch|rama|pull request|pr|deploy|build|typecheck/i] },
  { key: "deep_research", reason: "La solicitud pide investigación, comparación o análisis profundo.", patterns: [/investiga|investigaci[oó]n|compara|benchmark|fuentes|citas|topolog[ií]a|auditor[ií]a/i] },
  { key: "supabase_memory_data", reason: "La solicitud trata datos, Supabase, memoria o Syntia.", patterns: [/supabase|datos|tabla|memoria|syntia|sql|base de datos/i] },
  { key: "ads_campaigns", reason: "La solicitud trata campañas, ads, funnel, leads o marketing.", patterns: [/ads|campaña|campana|meta|tiktok|google ads|linkedin|lead|funnel|crm/i] },
  { key: "chido_monitoring", reason: "La solicitud trata Chido Casino en modo monitoreo/estado.", patterns: [/chido|casino|wallet|kyc|retiro|dep[oó]sito|apuesta/i] },
  { key: "payments_wallet", reason: "La solicitud trata pagos, wallet, retiro o pasarela.", patterns: [/stripe|paypal|d24|pago|wallet|retiro|pasarela|spei/i] },
  { key: "domains_cloud_ops", reason: "La solicitud trata dominios, DNS, Cloudflare, Hetzner o Vercel.", patterns: [/dominio|dns|cloudflare|namecheap|hetzner|vercel|railway|cloud/i] },
  { key: "hocker_node_agent", reason: "La solicitud trata nodo local, agente, shell o ejecución local.", patterns: [/hocker-node|agente local|node agent|shell|termux|ubuntu|comando/i] },
  { key: "email_notifications", reason: "La solicitud trata emails, notificaciones o mensajes transaccionales.", patterns: [/email|correo|notificaci[oó]n|resend|smtp/i] },
];

function findCapability(contract: HockerCapabilitiesContract, key: string): HockerCapability | undefined {
  return contract.capabilities.find((item) => item.key === key);
}

function fallbackCapability(contract: HockerCapabilitiesContract): HockerCapability {
  return findCapability(contract, "nova_native_chat") ?? contract.capabilities[0];
}

function matchCapabilityKeys(message: string): Set<string> {
  const clean = String(message || "").trim();
  const keys = new Set<string>();

  for (const route of ROUTES) {
    if (route.patterns.some((pattern) => pattern.test(clean))) {
      keys.add(route.key);
    }
  }

  return keys;
}

export function routeHockerCapabilityRequest(message: string, contract = getHockerCapabilitiesContract()): HockerToolRouteDecision {
  const clean = String(message || "").trim();

  const matched = ROUTES.find((route) => route.patterns.some((pattern) => pattern.test(clean)));
  const capability = matched ? findCapability(contract, matched.key) ?? fallbackCapability(contract) : fallbackCapability(contract);

  const shouldShowFinalButtons =
    capability.requires_owner_gate &&
    capability.status !== "pending" &&
    capability.status !== "blocked" &&
    capability.mode === "owner_gate";

  return {
    ok: true,
    message: clean,
    capability_key: capability.key,
    capability_label: capability.label,
    owner_agi: capability.owner_agi,
    support_agis: capability.support_agis,
    status: capability.status,
    mode: capability.mode,
    requires_owner_gate: capability.requires_owner_gate,
    can_execute_now: capability.can_execute_now,
    should_show_final_buttons: shouldShowFinalButtons,
    final_buttons: shouldShowFinalButtons ? capability.final_buttons : [],
    reason: matched?.reason ?? "Solicitud general: NOVA responde y decide si necesita delegar internamente.",
    next_step: capability.next_step,
  };
}


export function buildNovaChatCapabilitiesContext(
  message: string,
  project_id = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one",
) {
  const contract = getHockerCapabilitiesContract(project_id);
  const decision = routeHockerCapabilityRequest(message, contract);

  const alwaysRelevant = new Set([
    "nova_native_chat",
    "automatic_model_router",
    "automatic_agi_router",
    "queue_lock_owner_gate",
    "repo_code_github",
    "chido_monitoring",
    "chido_sensitive_ops",
  ]);

  alwaysRelevant.add(decision.capability_key);
  for (const key of matchCapabilityKeys(message)) {
    alwaysRelevant.add(key);
  }

  const relevant_capabilities = contract.public_context.capabilities
    .filter((capability) => alwaysRelevant.has(capability.key))
    .slice(0, 10)
    .map((capability) => ({
      key: capability.key,
      label: capability.label,
      status: capability.status,
      mode: capability.mode,
      owner_agi: capability.owner_agi,
      support_agis: capability.support_agis.slice(0, 4),
      requires_owner_gate: capability.requires_owner_gate,
      can_execute_now: capability.can_execute_now,
      current_limit: capability.current_limit,
      next_step: capability.next_step,
    }));

  return {
    version: contract.public_context.version,
    compact: true,
    instruction:
      "Contrato compacto para NOVA Chat. No prometas capacidades pending/blocked/partial como ejecutables. Si falta executor, dilo claro y prepara solo plan seguro.",
    allowed_final_buttons: contract.public_context.allowed_final_buttons,
    summary: contract.summary,
    decision: {
      capability_key: decision.capability_key,
      capability_label: decision.capability_label,
      owner_agi: decision.owner_agi,
      support_agis: decision.support_agis.slice(0, 4),
      status: decision.status,
      mode: decision.mode,
      requires_owner_gate: decision.requires_owner_gate,
      can_execute_now: decision.can_execute_now,
      should_show_final_buttons: decision.should_show_final_buttons,
      reason: decision.reason,
      next_step: decision.next_step,
    },
    relevant_capabilities,
  };
}


export function shouldAnswerCapabilitiesLocally(message: string): boolean {
  const clean = String(message || "").toLowerCase();

  return (
    /\b(qu[eé]|que)\s+(puedes|puede|pueden)\s+hacer\b/i.test(clean) ||
    /\bcapacidades\b/i.test(clean) ||
    /\bfunciones\b/i.test(clean) ||
    /\bintegraciones?\b/i.test(clean) ||
    /\bconectad[oa]s?\b/i.test(clean) ||
    /\bsin prometer\b/i.test(clean) ||
    /\bno inventes\b/i.test(clean) ||
    /\bqu[eé]\s+tienes\s+(listo|conectado|activo)\b/i.test(clean)
  );
}

function capabilityLine(capability: {
  label: string;
  status: string;
  mode: string;
  owner_agi: string;
  can_execute_now: boolean;
  current_limit: string;
}): string {
  const statusLabel: Record<string, string> = {
    active: "activo",
    protected: "protegido",
    partial: "parcial",
    pending: "pendiente",
    blocked: "bloqueado",
  };

  const modeLabel: Record<string, string> = {
    answer_now: "puedo responder ahora",
    read_now: "puedo leer ahora",
    prepare_only: "solo puedo preparar",
    owner_gate: "requiere Owner Gate",
    blocked: "no ejecutable",
  };

  return `- ${capability.label}: ${statusLabel[capability.status] ?? capability.status}; ${modeLabel[capability.mode] ?? capability.mode}. AGI interna: ${capability.owner_agi}. ${capability.current_limit}`;
}

export function buildNovaCapabilitiesReply(context: ReturnType<typeof buildNovaChatCapabilitiesContext>): string {
  const priority = [
    "image_generation",
    "video_generation",
    "repo_code_github",
    "chido_monitoring",
    "chido_sensitive_ops",
    "nova_native_chat",
    "automatic_model_router",
    "automatic_agi_router",
  ];

  const byKey = new Map(context.relevant_capabilities.map((capability) => [capability.key, capability]));
  const ordered = [
    ...priority.map((key) => byKey.get(key)).filter(Boolean),
    ...context.relevant_capabilities.filter((capability) => !priority.includes(capability.key)),
  ].slice(0, 10);

  return [
    "## Capacidades reales de NOVA",
    "",
    "Sí puedo responder desde Hocker ONE con routing automático de modelo y AGI. No tienes que elegir modelo ni AGI manualmente.",
    "",
    "### Estado por área",
    ...ordered.map((capability) => capabilityLine(capability)),
    "",
    "### Regla de seguridad",
    "No voy a prometer integraciones falsas ni ejecutar acciones productivas desde nova.agi. Lo pendiente se prepara como plan seguro; lo sensible pasa por Queue Lock, Owner Gate, auditoría y rollback.",
  ].join("\\n");
}


export function buildNovaUpstreamRuntimeContext(
  capabilitiesContext: ReturnType<typeof buildNovaChatCapabilitiesContext>,
  productionGateContext: Record<string, unknown>,
) {
  return {
    ...productionGateContext,
    capabilities_contract_injected: false,
    capabilities_contract_reason:
      "Hocker ONE conserva capabilities_contract en meta y responde capacidades localmente. A nova.agi solo se envía resumen mínimo para evitar exceso de contexto.",
    capability_summary: capabilitiesContext.summary,
    capability_decision: capabilitiesContext.decision,
  };
}
