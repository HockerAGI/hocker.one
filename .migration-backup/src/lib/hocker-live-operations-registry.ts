export type HockerOperationState =
  | "stable"
  | "supervising"
  | "protected"
  | "sandbox"
  | "future"
  | "attention";

export type HockerOperationEnvironment =
  | "production"
  | "internal"
  | "future";

export type HockerOperationNode = {
  id: string;
  name: string;
  category:
    | "core"
    | "agi"
    | "database"
    | "agent"
    | "gaming"
    | "archive";
  role: string;
  state: HockerOperationState;
  environment: HockerOperationEnvironment;
  visibleLabel: string;
  executiveSummary: string;
  safeNextAction: string;
};

export const HOCKER_LIVE_OPERATION_NODES: HockerOperationNode[] = [
  {
    id: "hocker-one",
    name: "Hocker ONE",
    category: "core",
    role: "Centro ejecutivo visual del ecosistema HOCKER",
    state: "stable",
    environment: "production",
    visibleLabel: "Producción activa",
    executiveSummary:
      "Panel central validado, con rutas públicas funcionando, rutas privadas protegidas y supervisión operativa estable.",
    safeNextAction:
      "Mantener validación continua con Centinela NOVA antes de cada nueva fase.",
  },
  {
    id: "nova-agi",
    name: "NOVA AGI",
    category: "agi",
    role: "Núcleo ejecutivo, voz central y coordinadora del ecosistema",
    state: "supervising",
    environment: "internal",
    visibleLabel: "Supervisión activa",
    executiveSummary:
      "NOVA ya cuenta con una capa de voz ejecutiva más humana, natural, clara y estructurada.",
    safeNextAction:
      "Conectar más señales del ecosistema sin exponer comandos internos al usuario final.",
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "database",
    role: "Base operativa, memoria, eventos, auditoría y control de acceso",
    state: "protected",
    environment: "production",
    visibleLabel: "Protegido",
    executiveSummary:
      "La base remota es fuente de verdad y está protegida contra migraciones accidentales.",
    safeNextAction:
      "Mantener freeze de migraciones hasta reconciliar completamente el baseline remoto.",
  },
  {
    id: "hocker-node-agent",
    name: "Hocker Node Agent",
    category: "agent",
    role: "Ejecutor interno controlado para acciones autorizadas",
    state: "sandbox",
    environment: "internal",
    visibleLabel: "Sandbox activo",
    executiveSummary:
      "Agente diseñado para ejecutar únicamente acciones permitidas, firmadas y controladas.",
    safeNextAction:
      "Mantenerlo aislado de clientes, apps públicas y dispositivos no controlados.",
  },
  {
    id: "chido-casino",
    name: "Chido Casino",
    category: "gaming",
    role: "Módulo propio de gaming, operaciones, wallet, KYC y monitoreo",
    state: "supervising",
    environment: "production",
    visibleLabel: "Monitoreado",
    executiveSummary:
      "Chido se mantiene como módulo real monitoreado; las acciones sensibles siguen bloqueadas hasta nueva aprobación.",
    safeNextAction:
      "Priorizar métricas, KYC, antifraude, auditoría y juego responsable antes de ejecución real.",
  },
  {
    id: "ecosystem-archive",
    name: "Ecosystem Archive",
    category: "archive",
    role: "Referencia histórica del ecosistema HOCKER",
    state: "future",
    environment: "future",
    visibleLabel: "Referencia futura",
    executiveSummary:
      "El zip histórico puede aportar ideas visuales, módulos y arquitectura, pero no se integra completo en esta fase.",
    safeNextAction:
      "Revisar solo piezas útiles en futuros sprints, sin copiar secretos, automatizaciones riesgosas ni lógica obsoleta.",
  },
];

export function getOperationStateLabel(state: HockerOperationState): string {
  switch (state) {
    case "stable":
      return "Estable";
    case "supervising":
      return "Supervisando";
    case "protected":
      return "Protegido";
    case "sandbox":
      return "Sandbox activo";
    case "future":
      return "Ruta futura";
    case "attention":
      return "Atención requerida";
    default:
      return "En revisión";
  }
}

export function getOperationStateTone(state: HockerOperationState): string {
  switch (state) {
    case "stable":
      return "text-emerald-300";
    case "supervising":
      return "text-cyan-300";
    case "protected":
      return "text-sky-300";
    case "sandbox":
      return "text-violet-300";
    case "future":
      return "text-amber-300";
    case "attention":
      return "text-rose-300";
    default:
      return "text-slate-300";
  }
}
