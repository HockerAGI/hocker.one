import {
  HOCKER_AGI_CANON,
  HOCKER_AGI_CANON_VERSION,
  getHockerAgiCanon,
  isHockerAgiId,
  type HockerAgiCanonRecord,
  type HockerAgiId,
} from "@/lib/hocker-agi-canon";

export const HOCKER_AGI_ALIASES: Readonly<Record<string, HockerAgiId>> = {
  "candy-ads": "candy",
  candy_ads: "candy",
  candy: "candy",
  "chido-gerente": "chido_gerente",
  chido_gerente: "chido_gerente",
  "chido-wins": "chido_wins",
  chido_wins: "chido_wins",
  "nexpa-agi": "nexpa",
  nexpa_agi: "nexpa",
  nexpa: "nexpa",
  "nova-ads": "nova_ads",
  nova_ads: "nova_ads",
  "pro-ia": "pro_ia",
  pro: "pro_ia",
  pro_ia: "pro_ia",
  "trackhok-agi": "trackhok",
  trackhok_agi: "trackhok",
  trackhok: "trackhok",
  shadows_ia: "shadows",
};

const GUARDED_AGIS = new Set<HockerAgiId>([
  "jurix",
  "nexpa",
  "trackhok",
  "chido_wins",
  "chido_gerente",
]);

const GUARDED_AUTONOMY = new Set<HockerAgiId>([
  "nova",
  "syntia",
  "vertx",
  "jurix",
  "numia",
  "nexpa",
  "chido_wins",
  "chido_gerente",
]);

const AGI_TOOL_KEYS: Readonly<Record<HockerAgiId, readonly string[]>> = {
  nova: [
    "ai_gateway",
    "nova_orchestrator",
    "supabase",
    "github",
    "vercel",
    "trigger",
    "langfuse",
    "meta_ads",
    "google_ads",
    "tiktok_ads",
    "linkedin_ads",
    "stripe",
    "paypal",
    "namecheap",
    "cloudflare",
    "hetzner",
    "openai",
    "gemini",
    "email",
  ],
  syntia: ["ai_gateway", "nova_orchestrator", "supabase"],
  vertx: ["ai_gateway", "nova_orchestrator", "supabase", "github", "vercel", "langfuse"],
  jurix: ["ai_gateway", "nova_orchestrator", "supabase", "github"],
  curvewind: ["ai_gateway", "nova_orchestrator", "supabase"],
  numia: ["ai_gateway", "nova_orchestrator", "supabase", "stripe", "paypal"],
  nova_ads: [
    "ai_gateway",
    "nova_orchestrator",
    "supabase",
    "meta_ads",
    "google_ads",
    "tiktok_ads",
    "linkedin_ads",
  ],
  candy: ["ai_gateway", "nova_orchestrator", "supabase", "openai", "gemini"],
  pro_ia: ["ai_gateway", "nova_orchestrator", "supabase", "heygen", "openai", "gemini"],
  hostia: [
    "ai_gateway",
    "nova_orchestrator",
    "supabase",
    "github",
    "vercel",
    "cloudflare",
    "hetzner",
    "namecheap",
  ],
  trackhok: ["ai_gateway", "nova_orchestrator", "supabase", "trigger"],
  nexpa: ["ai_gateway", "nova_orchestrator", "supabase"],
  chido_wins: ["ai_gateway", "nova_orchestrator", "supabase", "d24"],
  chido_gerente: ["ai_gateway", "nova_orchestrator", "supabase", "d24", "paypal"],
  shadows: ["nova_orchestrator", "supabase"],
  revia: ["ai_gateway", "nova_orchestrator", "supabase", "email"],
};

const CHAT_PROFILE_RULES: ReadonlyArray<{
  profile: Exclude<HockerAgiId, "shadows">;
  pattern: RegExp;
}> = [
  {
    profile: "chido_gerente",
    pattern: /\b(kyc|dep[oó]sito|retiro|bono|promoci[oó]n|soporte casino|operaci[oó]n casino|balance casino)\b/i,
  },
  {
    profile: "chido_wins",
    pattern: /\b(probabilidad casino|simulaci[oó]n casino|riesgo de apuesta|juego responsable|chido wins)\b/i,
  },
  {
    profile: "nexpa",
    pattern: /\b(control parental|seguridad familiar|bienestar digital|reducci[oó]n de da[ñn]o|consentimiento familiar|nexpa)\b/i,
  },
  {
    profile: "trackhok",
    pattern: /\b(rastreo autorizado|monitoreo|telemetr[ií]a|se[ñn]al|estado de nodo|ruta|anomal[ií]a operativa|trackhok)\b/i,
  },
  {
    profile: "pro_ia",
    pattern: /\b(video|audio|reel|motion|storyboard|doblaje|hook audiovisual|edici[oó]n audiovisual|pro ia)\b/i,
  },
  {
    profile: "candy",
    pattern: /\b(dise[ñn]o|branding|identidad visual|composici[oó]n|tipograf[ií]a|color|creatividad visual|safe zone|candy)\b/i,
  },
  {
    profile: "nova_ads",
    pattern: /\b(campa[ñn]a|ads|publicidad|marketing|audiencia|segmentaci[oó]n|ctr|cpc|cpl|roas|meta ads|google ads|tiktok ads|linkedin ads)\b/i,
  },
  {
    profile: "revia",
    pattern: /\b(venta|ingresos|revenue|prospecto|lead|pipeline|afiliado|objeci[oó]n|seguimiento comercial|service desk|demo|cotizaci[oó]n)\b/i,
  },
  {
    profile: "numia",
    pattern: /\b(finanzas|costo|presupuesto|roi|cac|cpl|roas|margen|contabilidad|gasto|pago|reembolso|stripe|paypal|tokens)\b/i,
  },
  {
    profile: "jurix",
    pattern: /\b(legal|contrato|privacidad|cumplimiento|compliance|ley|t[eé]rminos|consentimiento|pol[ií]tica de plataforma|kyc legal)\b/i,
  },
  {
    profile: "vertx",
    pattern: /\b(seguridad|vulnerabilidad|ataque|permiso|token|firma|hmac|rls|auth|zero trust|auditor[ií]a t[eé]cnica)\b/i,
  },
  {
    profile: "syntia",
    pattern: /\b(memoria|contexto|recuerda|historial|resumen|continuidad|deduplicaci[oó]n|memory mirror|aprendizaje)\b/i,
  },
  {
    profile: "hostia",
    pattern: /\b(c[oó]digo|repo|github|deploy|vercel|railway|servidor|api|supabase|android|apk|aab|bug|dns|dominio|certificado|hosting|infraestructura)\b/i,
  },
  {
    profile: "curvewind",
    pattern: /\b(predicci[oó]n|forecast|escenario|tendencia|probabilidad|simulaci[oó]n estrat[eé]gica|incertidumbre|curvewind)\b/i,
  },
];

function normalizedKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean)));
}

export function canonicalAgiId(value: unknown, fallback: HockerAgiId = "nova"): HockerAgiId {
  const key = normalizedKey(value);
  if (!key) return fallback;
  if (isHockerAgiId(key)) return key;
  return HOCKER_AGI_ALIASES[key] ?? fallback;
}

export function requireCanonicalAgi(value: unknown): HockerAgiCanonRecord {
  const id = canonicalAgiId(value);
  const agi = getHockerAgiCanon(id);
  if (!agi) throw new Error(`AGI_PROFILE_NOT_FOUND: ${id}`);
  return agi;
}

export function isOperationalAgi(value: unknown): boolean {
  return canonicalAgiId(value) !== "shadows";
}

export function agiRegistryStatus(id: HockerAgiId): "active" | "guarded" | "planned" {
  if (id === "shadows") return "planned";
  return GUARDED_AGIS.has(id) ? "guarded" : "active";
}

export function agiAgentStatus(
  id: HockerAgiId,
): "live" | "integration" | "development" | "protected" {
  if (id === "nova") return "live";
  if (id === "syntia" || id === "vertx" || id === "numia") return "integration";
  if (id === "shadows" || GUARDED_AGIS.has(id)) return "protected";
  return "development";
}

export function agiAgentRole(id: HockerAgiId): string {
  const roles: Record<HockerAgiId, string> = {
    nova: "orchestrator",
    syntia: "memory",
    vertx: "security",
    jurix: "legal",
    curvewind: "prediction",
    numia: "finance",
    nova_ads: "ads",
    candy: "creative",
    pro_ia: "production",
    hostia: "infrastructure",
    trackhok: "monitoring",
    nexpa: "safety",
    chido_wins: "risk",
    chido_gerente: "operations",
    shadows: "ephemeral",
    revia: "revenue",
  };
  return roles[id];
}

export function agiAutonomyLevel(id: HockerAgiId): "guarded" | "manual" {
  return GUARDED_AUTONOMY.has(id) ? "guarded" : "manual";
}

export function agiCapabilities(agi: HockerAgiCanonRecord): string[] {
  return unique([
    agi.domain,
    ...agi.modules,
    ...agi.learns,
    ...agi.sources,
    ...agi.can_propose,
    ...agi.memory_feed,
  ]);
}

export function agiToolKeys(id: HockerAgiId): string[] {
  return [...AGI_TOOL_KEYS[id]];
}

export function canonicalAgiMeta(agi: HockerAgiCanonRecord) {
  return {
    key: agi.id.toUpperCase(),
    kind: agiAgentRole(agi.id),
    level: agi.level,
    status: agiRegistryStatus(agi.id),
    mission: agi.role,
    domain: agi.domain,
    functions: [...agi.modules, ...agi.can_propose],
    objectives: [...agi.supervises, ...agi.prevents],
    limits: [...agi.blocked],
    modules: [...agi.modules],
    learns: [...agi.learns],
    supervises: [...agi.supervises],
    sources: [...agi.sources],
    can_propose: [...agi.can_propose],
    prevents: [...agi.prevents],
    memory_scope: [...agi.memory_feed],
    memory_feed: [...agi.memory_feed],
    priority: agi.id === "nova" ? 1 : agi.level === "2" ? 2 : agi.level === "4" ? 4 : 3,
    parent_id: agi.id === "nova" ? null : "nova",
    owner_area: agi.domain,
    registry_version: `agi-canon-${HOCKER_AGI_CANON_VERSION}`,
    updated_by: "hocker-agi-canon",
    system_prompt: `Eres ${agi.name}. ${agi.role}`,
    allowed_commands: [],
  };
}

export function buildCanonicalProfilePrompt(agi: HockerAgiCanonRecord): string {
  return [
    `Eres ${agi.name}. ${agi.role}`,
    `Identidad operativa: ${agi.name} (${agi.id}).`,
    `Canon HOCKER: ${HOCKER_AGI_CANON_VERSION}.`,
    `Nivel: ${agi.level}.`,
    `Dominio: ${agi.domain}.`,
    `Capacidades internas:\n- ${agi.modules.join("\n- ")}`,
    `Aprende de:\n- ${agi.learns.join("\n- ")}`,
    `Supervisa:\n- ${agi.supervises.join("\n- ")}`,
    `Fuentes permitidas y esperadas:\n- ${agi.sources.join("\n- ")}`,
    `Puede proponer:\n- ${agi.can_propose.join("\n- ")}`,
    `No puede ejecutar sin gate:\n- ${agi.blocked.join("\n- ")}`,
    `Errores que debe evitar repetir:\n- ${agi.prevents.join("\n- ")}`,
    `Feed Memory Mirror especializado:\n- ${agi.memory_feed.join("\n- ")}`,
    "Usa únicamente información disponible y evidencia verificable.",
    "Distingue hechos comprobados, inferencias y datos faltantes.",
    "No inventes ejecuciones, herramientas, métricas, fuentes ni resultados.",
    "No ejecutes acciones externas. Propón cualquier acción para Owner Gate, incluyendo los gates especializados de Vertx, Jurix o Numia cuando correspondan.",
    "Responde en español de forma clara, ejecutiva y alineada con tu dominio.",
  ].join("\n\n");
}

export function routeChatProfile(message: string): Exclude<HockerAgiId, "shadows"> {
  return CHAT_PROFILE_RULES.find((rule) => rule.pattern.test(message))?.profile ?? "nova";
}

export function canonicalAgentRows(projectId: string, now = new Date().toISOString()) {
  return HOCKER_AGI_CANON.map((agi) => ({
    project_id: projectId,
    agi_id: agi.id,
    name: agi.name,
    role: agiAgentRole(agi.id),
    status: agiAgentStatus(agi.id),
    autonomy_level: agiAutonomyLevel(agi.id),
    allow_actions: false,
    capabilities: agiCapabilities(agi),
    meta: {
      source: "hocker-agi-canon",
      canon_version: HOCKER_AGI_CANON_VERSION,
      level: agi.level,
      domain: agi.domain,
      description: agi.role,
      operational: agi.id !== "shadows",
      tool_keys: agiToolKeys(agi.id),
    },
    created_at: now,
    updated_at: now,
  }));
}

export function canonicalRegistrySnapshot() {
  return HOCKER_AGI_CANON.map((agi) => ({
    id: agi.id,
    name: agi.name,
    level: agi.level,
    domain: agi.domain,
    status: agiRegistryStatus(agi.id),
    operational: agi.id !== "shadows",
    role: agi.role,
    tool_keys: agiToolKeys(agi.id),
    capabilities: agiCapabilities(agi),
  }));
}
