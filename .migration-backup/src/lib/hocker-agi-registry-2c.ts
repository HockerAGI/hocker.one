export type HockerAgiCluster =
  | "core"
  | "memory"
  | "security"
  | "strategy"
  | "marketing"
  | "creative"
  | "revenue"
  | "infrastructure"
  | "legal"
  | "finance"
  | "protected"
  | "tracking"
  | "temporary";

export type HockerAgiStatus =
  | "live"
  | "ready"
  | "protected"
  | "building"
  | "blocked";

export type HockerAgiRegistryItem = {
  id: string;
  name: string;
  shortName: string;
  cluster: HockerAgiCluster;
  status: HockerAgiStatus;
  ownerVisible: true;
  clientLabel: string;
  userLabel: string;
  role: string;
  humanPurpose: string;
  ownerSummary: string;
  allowedByDefault: boolean;
  sensitive: boolean;
};

export const HOCKER_AGI_REGISTRY_2C: HockerAgiRegistryItem[] = [
  {
    id: "nova",
    name: "NOVA",
    shortName: "NOVA",
    cluster: "core",
    status: "live",
    ownerVisible: true,
    clientLabel: "Asistente central",
    userLabel: "NOVA",
    role: "Núcleo central, conversación, decisión y coordinación.",
    humanPurpose: "Entiende lo que necesitas, prepara acciones y pide aprobación cuando algo es real.",
    ownerSummary: "Coordina el ecosistema HOCKER completo bajo Owner Gate.",
    allowedByDefault: true,
    sensitive: false,
  },
  {
    id: "syntia",
    name: "Syntia",
    shortName: "Syntia",
    cluster: "memory",
    status: "ready",
    ownerVisible: true,
    clientLabel: "Memoria",
    userLabel: "Aprendizaje",
    role: "Memoria, sincronización, contexto y aprendizaje.",
    humanPurpose: "Guarda continuidad y ayuda a que NOVA no pierda el hilo.",
    ownerSummary: "Controla memoria operativa, evidencia y sincronía.",
    allowedByDefault: true,
    sensitive: false,
  },
  {
    id: "vertx",
    name: "Vertx",
    shortName: "Vertx",
    cluster: "security",
    status: "ready",
    ownerVisible: true,
    clientLabel: "Seguridad",
    userLabel: "Protección",
    role: "Seguridad, auditoría, permisos y defensa.",
    humanPurpose: "Cuida que nada sensible se ejecute sin permiso.",
    ownerSummary: "Valida riesgo, permisos, bloqueos y seguridad operativa.",
    allowedByDefault: true,
    sensitive: true,
  },
  {
    id: "curvewind",
    name: "Curvewind",
    shortName: "Curvewind",
    cluster: "strategy",
    status: "building",
    ownerVisible: true,
    clientLabel: "Estrategia",
    userLabel: "Recomendaciones",
    role: "Predicción, estrategia y análisis de escenarios.",
    humanPurpose: "Ayuda a decidir qué movimiento conviene hacer después.",
    ownerSummary: "Modela escenarios, oportunidades, riesgos y predicción.",
    allowedByDefault: false,
    sensitive: false,
  },
  {
    id: "nova-ads",
    name: "Nova Ads",
    shortName: "Nova Ads",
    cluster: "marketing",
    status: "building",
    ownerVisible: true,
    clientLabel: "Campañas",
    userLabel: "Campañas",
    role: "Campañas, pauta, social ads y performance.",
    humanPurpose: "Prepara campañas y reportes de marketing.",
    ownerSummary: "Gestiona estrategia publicitaria y performance.",
    allowedByDefault: false,
    sensitive: false,
  },
  {
    id: "candy-ads",
    name: "Candy Ads",
    shortName: "Candy",
    cluster: "creative",
    status: "building",
    ownerVisible: true,
    clientLabel: "Diseño",
    userLabel: "Diseño",
    role: "Creatividad visual, branding y diseño emocional.",
    humanPurpose: "Convierte ideas en piezas visuales con identidad.",
    ownerSummary: "Creatividad, branding, visuales y contenido emocional.",
    allowedByDefault: false,
    sensitive: false,
  },
  {
    id: "pro-ia",
    name: "PRO IA",
    shortName: "PRO IA",
    cluster: "creative",
    status: "building",
    ownerVisible: true,
    clientLabel: "Video",
    userLabel: "Video",
    role: "Video, edición, voz, motion y producción audiovisual.",
    humanPurpose: "Prepara contenido audiovisual y piezas premium.",
    ownerSummary: "Producción audiovisual, reels, voz, motion y video.",
    allowedByDefault: false,
    sensitive: false,
  },
  {
    id: "revia",
    name: "Revia AGI",
    shortName: "Revia",
    cluster: "revenue",
    status: "building",
    ownerVisible: true,
    clientLabel: "Ventas",
    userLabel: "Ventas",
    role: "Revenue, ventas, funnels, conversión y crecimiento.",
    humanPurpose: "Ayuda a vender más con claridad y seguimiento.",
    ownerSummary: "Optimiza revenue, funnels, cierres y conversión.",
    allowedByDefault: false,
    sensitive: false,
  },
  {
    id: "hostia",
    name: "Hostia",
    shortName: "Hostia",
    cluster: "infrastructure",
    status: "building",
    ownerVisible: true,
    clientLabel: "Conexiones",
    userLabel: "Conexiones",
    role: "Infraestructura, APIs, dominios, tokens y hosting.",
    humanPurpose: "Revisa conexiones, despliegues y servicios técnicos.",
    ownerSummary: "Controla infraestructura, GitHub, Vercel, dominios y APIs.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "jurix",
    name: "Jurix",
    shortName: "Jurix",
    cluster: "legal",
    status: "building",
    ownerVisible: true,
    clientLabel: "Legal",
    userLabel: "Legal",
    role: "Legal, contratos, políticas y compliance.",
    humanPurpose: "Ayuda a revisar riesgos legales antes de avanzar.",
    ownerSummary: "Revisión legal, privacidad, contratos y políticas.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "numia",
    name: "Numia",
    shortName: "Numia",
    cluster: "finance",
    status: "building",
    ownerVisible: true,
    clientLabel: "Finanzas",
    userLabel: "Finanzas",
    role: "Finanzas, ROI, presupuestos y facturación.",
    humanPurpose: "Explica dinero, costos, riesgos y oportunidades.",
    ownerSummary: "Control financiero, ROI, facturación y presupuestos.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "chido-wins",
    name: "Chido Wins",
    shortName: "Chido Wins",
    cluster: "protected",
    status: "protected",
    ownerVisible: true,
    clientLabel: "Análisis protegido",
    userLabel: "Análisis",
    role: "Predicción y análisis para Chido bajo control protegido.",
    humanPurpose: "Analiza información protegida sin ejecutar acciones sensibles libremente.",
    ownerSummary: "Predicción y análisis para Chido con reglas estrictas.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "chido-gerente",
    name: "Chido Gerente",
    shortName: "Chido Gerente",
    cluster: "protected",
    status: "protected",
    ownerVisible: true,
    clientLabel: "Operación protegida",
    userLabel: "Operación",
    role: "Operación, métricas y administración de Chido.",
    humanPurpose: "Supervisa operación protegida con permisos claros.",
    ownerSummary: "Administración de Chido bajo control legal, financiero y owner.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "nexpa",
    name: "NEXPA AGI",
    shortName: "NEXPA",
    cluster: "security",
    status: "protected",
    ownerVisible: true,
    clientLabel: "Protección",
    userLabel: "Protección",
    role: "Seguridad familiar/operativa bajo permisos y compliance.",
    humanPurpose: "Gestiona protección y alertas con autorización.",
    ownerSummary: "Módulo sensible: permisos, compliance y auditoría obligatoria.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "trackhok",
    name: "TrackHok AGI",
    shortName: "TrackHok",
    cluster: "tracking",
    status: "protected",
    ownerVisible: true,
    clientLabel: "Monitoreo",
    userLabel: "Monitoreo",
    role: "Rastreo, monitoreo, logística y alertas predictivas.",
    humanPurpose: "Muestra ubicación, alertas o rutas sólo con permisos válidos.",
    ownerSummary: "Monitoreo con consentimiento, trazabilidad y límites claros.",
    allowedByDefault: false,
    sensitive: true,
  },
  {
    id: "shadows",
    name: "Shadows IA",
    shortName: "Shadows",
    cluster: "temporary",
    status: "building",
    ownerVisible: true,
    clientLabel: "Procesos automáticos",
    userLabel: "Procesos",
    role: "Microprocesos temporales controlados, sin rostro público.",
    humanPurpose: "Ejecuta pequeñas tareas de apoyo bajo supervisión.",
    ownerSummary: "Procesos efímeros controlados por NOVA y Owner Gate.",
    allowedByDefault: false,
    sensitive: true,
  },
] as const;

export const HOCKER_AGI_REGISTRY_2C_VERSION = "13-2C-A";

export function getHockerAgiById(id: string) {
  return HOCKER_AGI_REGISTRY_2C.find((agi) => agi.id === id) ?? null;
}

export function getOwnerVisibleAgis() {
  return HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.ownerVisible);
}

export function getClientVisibleAgiLabels() {
  return HOCKER_AGI_REGISTRY_2C.map((agi) => ({
    id: agi.id,
    label: agi.clientLabel,
    purpose: agi.humanPurpose,
    status: agi.status,
  }));
}

