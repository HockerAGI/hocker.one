import type { ExternalServiceItem } from "@/lib/external-services";

export type AppStatus =
  | "live"
  | "protected"
  | "integration"
  | "development"
  | "pending"
  | "blocked"
  | "not_created";

export type NodeStatus = AppStatus;
export type RepoStatus = "connected" | "pending";
export type CommandStatus = "done" | "running" | "queued" | "needs_approval" | "error" | "canceled";
export type EventLevel = "info" | "warn" | "error";
export type ModuleKind = "app" | "agi" | "nova";

export type AppRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  integration: string;
  projectId: string;
  status: AppStatus;
  note: string;
  group: "control" | "business" | "operation" | "special";
  href: string;
  logoSrc?: string;
  iconSrc?: string;
  accent: string;
};

export type AgiRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  nodeId: string;
  integration: string;
  status: NodeStatus;
  note: string;
  group: "core" | "trident" | "creative" | "operative";
  href: string;
  logoSrc?: string;
  iconSrc?: string;
  accent: string;
};

export type RepoRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  branch: string;
  status: RepoStatus;
  note: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardEventItem = {
  id: string;
  title: string;
  detail: string;
  level: EventLevel;
  at: string;
};

export type DashboardCommandItem = {
  id: string;
  command: string;
  projectId: string;
  status: CommandStatus;
  createdAt: string;
};

export type DashboardSummary = {
  snapshotAt: string;
  metrics: DashboardMetric[];
  apps: AppRegistryItem[];
  agis: AgiRegistryItem[];
  repos: RepoRegistryItem[];
  services: ExternalServiceItem[];
  recentEvents: DashboardEventItem[];
  recentCommands: DashboardCommandItem[];
};

export const APP_GROUP_LABELS: Record<AppRegistryItem["group"], { title: string; text: string }> = {
  control: {
    title: "Control",
    text: "Paneles que ordenan y supervisan el ecosistema.",
  },
  business: {
    title: "Negocio",
    text: "Herramientas para vender, atender clientes y operar marcas.",
  },
  operation: {
    title: "Operación",
    text: "Sistemas internos para datos, pagos y respaldo.",
  },
  special: {
    title: "Apps especiales",
    text: "Productos sensibles o en expansión que requieren control claro.",
  },
};

export const AGI_GROUP_LABELS: Record<AgiRegistryItem["group"], { title: string; text: string }> = {
  core: {
    title: "Núcleo",
    text: "La inteligencia central que coordina todo.",
  },
  trident: {
    title: "Tridente estratégico",
    text: "Memoria, seguridad y predicción trabajando bajo NOVA.",
  },
  creative: {
    title: "Creativas y clientes",
    text: "Contenido, campañas, soporte, ventas y experiencia del cliente.",
  },
  operative: {
    title: "Operativas",
    text: "Infraestructura, legal, finanzas, Chido, seguridad y rastreo.",
  },
};

export const APP_REGISTRY: AppRegistryItem[] = [
  {
    key: "hocker-one",
    title: "Hocker ONE",
    subtitle: "Panel maestro del ecosistema.",
    integration: "NOVA + Syntia + Vertx",
    projectId: "hocker-one",
    status: "live",
    note: "Activo y protegido como centro privado.",
    group: "control",
    href: "/owner",
    iconSrc: "/ecosystem/apps/hocker-one/icon.png",
    logoSrc: "/ecosystem/apps/hocker-one/logo.png",
    accent: "cyan",
  },
  {
    key: "hocker-ads",
    title: "Hocker Ads",
    subtitle: "Publicidad y contenido con IA.",
    integration: "Nova Ads + Candy Ads + PRO IA",
    projectId: "hocker-ads",
    status: "integration",
    note: "Base visual lista; conexión operativa en integración.",
    group: "business",
    href: "/apps#hocker-ads",
    iconSrc: "/ecosystem/apps/hocker-ads/icon.png",
    logoSrc: "/ecosystem/apps/hocker-ads/logo.png",
    accent: "sky",
  },
  {
    key: "hocker-hub",
    title: "Hocker Hub",
    subtitle: "CRM para ventas y clientes.",
    integration: "Revia AGI + Numia",
    projectId: "hocker-hub",
    status: "pending",
    note: "Planeado para gestión comercial y atención.",
    group: "business",
    href: "/apps#hocker-hub",
    iconSrc: "/ecosystem/apps/hocker-hub/icon.png",
    logoSrc: "/ecosystem/apps/hocker-hub/logo.png",
    accent: "violet",
  },
  {
    key: "hocker-supply",
    title: "HKR Supply",
    subtitle: "Tienda y productos del ecosistema.",
    integration: "Supply + Wallet + Numia",
    projectId: "hocker-supply",
    status: "integration",
    note: "Identidad visual cerrada; operación en integración.",
    group: "business",
    href: "/supply",
    iconSrc: "/ecosystem/apps/hocker-supply/icon.png",
    logoSrc: "/ecosystem/apps/hocker-supply/logo.png",
    accent: "amber",
  },
  {
    key: "hocker-drive-cloud",
    title: "Hocker Drive Cloud",
    subtitle: "Nube privada y respaldos.",
    integration: "Syntia + Vertx",
    projectId: "hocker-drive-cloud",
    status: "pending",
    note: "Base visual lista; backend pendiente.",
    group: "operation",
    href: "/memory",
    iconSrc: "/ecosystem/apps/hocker-drive-cloud/icon.png",
    logoSrc: "/ecosystem/apps/hocker-drive-cloud/logo.png",
    accent: "cyan",
  },
  {
    key: "hocker-wallet",
    title: "Hocker Wallet",
    subtitle: "Pagos y control financiero.",
    integration: "Numia + Jurix",
    projectId: "hocker-wallet",
    status: "pending",
    note: "Debe activarse solo con cumplimiento y pasarela real.",
    group: "operation",
    href: "/apps#hocker-wallet",
    iconSrc: "/ecosystem/apps/hocker-wallet/icon.png",
    logoSrc: "/ecosystem/apps/hocker-wallet/logo.png",
    accent: "emerald",
  },
  {
    key: "chido-casino",
    title: "Chido Casino",
    subtitle: "Casino IA en revisión segura.",
    integration: "Chido Wins + Chido Gerente",
    projectId: "chido-casino",
    status: "protected",
    note: "Ruta sensible. Monitoreo y revisión sin ejecución real desde Hocker ONE.",
    group: "special",
    href: "/chido",
    iconSrc: "/ecosystem/apps/chido-casino/icon.png",
    logoSrc: "/ecosystem/apps/chido-casino/logo.png",
    accent: "rose",
  },
  {
    key: "trackhok",
    title: "TrackHok",
    subtitle: "Rastreo y monitoreo autorizado.",
    integration: "TrackHok AGI + Vertx",
    projectId: "trackhok",
    status: "development",
    note: "En desarrollo. Debe usarse solo con autorización.",
    group: "special",
    href: "/apps#trackhok",
    iconSrc: "/ecosystem/apps/trackhok/icon.png",
    logoSrc: "/ecosystem/apps/trackhok/logo.png",
    accent: "sky",
  },
  {
    key: "nexpa-app",
    title: "NEXPA App",
    subtitle: "Seguridad y control familiar.",
    integration: "NEXPA AGI + Jurix",
    projectId: "nexpa-app",
    status: "development",
    note: "En desarrollo con enfoque legal y ético.",
    group: "special",
    href: "/apps#nexpa-app",
    iconSrc: "/ecosystem/apps/nexpa-app/icon.png",
    logoSrc: "/ecosystem/apps/nexpa-app/logo.png",
    accent: "violet",
  },
  {
    key: "hocker-up",
    title: "Hocker Up",
    subtitle: "Aprendizaje y comunidad.",
    integration: "Syntia + Candy Ads",
    projectId: "hocker-up",
    status: "pending",
    note: "Planeado como red educativa y comunidad IA.",
    group: "special",
    href: "/apps#hocker-up",
    iconSrc: "/ecosystem/apps/hocker-up/icon.png",
    logoSrc: "/ecosystem/apps/hocker-up/logo.png",
    accent: "cyan",
  },
];

export const AGI_REGISTRY: AgiRegistryItem[] = [
  {
    key: "nova",
    title: "NOVA",
    subtitle: "IA madre del ecosistema.",
    nodeId: "nova",
    integration: "Core",
    status: "live",
    note: "Orquesta apps, AGIs, seguridad y decisiones.",
    group: "core",
    href: "/chat",
    iconSrc: "/ecosystem/agis/nova/icon.png",
    logoSrc: "/ecosystem/agis/nova/logo.png",
    accent: "cyan",
  },
  {
    key: "syntia",
    title: "Syntia",
    subtitle: "Memoria y sincronización.",
    nodeId: "syntia",
    integration: "Hocker Brain + Drive Cloud",
    status: "integration",
    note: "Base conceptual y flujo de memoria en integración.",
    group: "trident",
    href: "/agis#syntia",
    accent: "cyan",
  },
  {
    key: "vertx",
    title: "Vertx",
    subtitle: "Seguridad y auditoría.",
    nodeId: "vertx",
    integration: "Security + Governance",
    status: "integration",
    note: "Reglas y protección activas en Hocker ONE.",
    group: "trident",
    href: "/security",
    accent: "emerald",
  },
  {
    key: "curvewind",
    title: "Curvewind",
    subtitle: "Estrategia y predicción.",
    nodeId: "curvewind",
    integration: "NOVA + Numia",
    status: "development",
    note: "Capa estratégica en desarrollo.",
    group: "trident",
    href: "/agis#curvewind",
    accent: "violet",
  },
  {
    key: "nova-ads",
    title: "Nova Ads",
    subtitle: "Campañas y anuncios.",
    nodeId: "nova-ads",
    integration: "Hocker Ads",
    status: "development",
    note: "En desarrollo para pauta y optimización.",
    group: "creative",
    href: "/agis#nova-ads",
    accent: "sky",
  },
  {
    key: "candy-ads",
    title: "Candy Ads",
    subtitle: "Diseño visual y creatividad.",
    nodeId: "candy-ads",
    integration: "Candy Studio",
    status: "development",
    note: "Creatividad visual en desarrollo.",
    group: "creative",
    href: "/agis#candy-ads",
    accent: "pink",
  },
  {
    key: "pro-ia",
    title: "PRO IA",
    subtitle: "Video, audio y producción.",
    nodeId: "pro-ia",
    integration: "Contenido + Hocker Ads",
    status: "development",
    note: "Producción audiovisual en desarrollo.",
    group: "creative",
    href: "/agis#pro-ia",
    accent: "violet",
  },
  {
    key: "revia",
    title: "Revia AGI",
    subtitle: "Atención, soporte y ventas.",
    nodeId: "revia",
    integration: "Hocker Hub + Hocker Ads",
    status: "development",
    note: "Orientada a clientes, soporte, ventas y seguimiento.",
    group: "creative",
    href: "/agis#revia",
    accent: "amber",
  },
  {
    key: "hostia",
    title: "Hostia",
    subtitle: "Servidores y conexiones.",
    nodeId: "hostia",
    integration: "Infraestructura",
    status: "development",
    note: "Infraestructura y enlaces en estabilización.",
    group: "operative",
    href: "/integrations",
    accent: "sky",
  },
  {
    key: "jurix",
    title: "Jurix",
    subtitle: "Legal y contratos.",
    nodeId: "jurix",
    integration: "Governance",
    status: "development",
    note: "Compliance y documentos legales en desarrollo.",
    group: "operative",
    href: "/governance",
    accent: "emerald",
  },
  {
    key: "numia",
    title: "Numia",
    subtitle: "Finanzas y control.",
    nodeId: "numia",
    integration: "Wallet + Supply",
    status: "integration",
    note: "Control financiero en integración.",
    group: "operative",
    href: "/supply",
    accent: "emerald",
  },
  {
    key: "chido-wins",
    title: "Chido Wins",
    subtitle: "Predicción y riesgo responsable.",
    nodeId: "chido-wins",
    integration: "Chido Casino",
    status: "protected",
    note: "Debe mantenerse bajo revisión segura.",
    group: "operative",
    href: "/chido",
    accent: "rose",
  },
  {
    key: "chido-gerente",
    title: "Chido Gerente",
    subtitle: "Operación de Chido Casino.",
    nodeId: "chido-gerente",
    integration: "Chido Casino",
    status: "protected",
    note: "Operación sensible con ejecución real bloqueada desde Hocker ONE.",
    group: "operative",
    href: "/chido",
    accent: "amber",
  },
  {
    key: "nexpa-agi",
    title: "NEXPA AGI",
    subtitle: "Seguridad familiar inteligente.",
    nodeId: "nexpa-agi",
    integration: "NEXPA App",
    status: "development",
    note: "En desarrollo con enfoque ético.",
    group: "operative",
    href: "/agis#nexpa-agi",
    accent: "violet",
  },
  {
    key: "trackhok-agi",
    title: "TrackHok AGI",
    subtitle: "Rastreo autorizado y monitoreo.",
    nodeId: "trackhok-agi",
    integration: "TrackHok",
    status: "development",
    note: "En desarrollo para monitoreo autorizado.",
    group: "operative",
    href: "/agis#trackhok-agi",
    accent: "sky",
  },
];

export const REPO_REGISTRY: RepoRegistryItem[] = [
  {
    key: "hocker-one",
    title: "hocker.one",
    subtitle: "Panel maestro privado.",
    branch: "main",
    status: "connected",
    note: "Repositorio activo del panel.",
  },
  {
    key: "nova.agi",
    title: "nova.agi",
    subtitle: "Núcleo conversacional.",
    branch: "main",
    status: "connected",
    note: "Repositorio de NOVA.",
  },
  {
    key: "hocker-node-agent",
    title: "hocker-node-agent",
    subtitle: "Ejecutor físico seguro.",
    branch: "main",
    status: "connected",
    note: "Agente local bajo sandbox.",
  },
  {
    key: "chido.casino",
    title: "chido.casino",
    subtitle: "Casino IA protegido.",
    branch: "main",
    status: "connected",
    note: "Sistema sensible; requiere compliance.",
  },
];

export function getStatusLabel(status: string): string {
  switch (status) {
    case "live":
    case "connected":
      return "Activo";
    case "protected":
      return "Protegido";
    case "integration":
    case "ready":
      return "En integración";
    case "development":
    case "in_development":
      return "En desarrollo";
    case "pending":
      return "Pendiente";
    case "blocked":
      return "Bloqueado";
    case "not_created":
      return "No existe aún";
    case "queued":
      return "En cola";
    case "running":
      return "En curso";
    case "done":
      return "Listo";
    case "needs_approval":
      return "Revisión";
    case "error":
      return "Con error";
    case "canceled":
      return "Cancelado";
    default:
      return "En desarrollo";
  }
}

export function getStatusTone(status: string): string {
  switch (status) {
    case "live":
    case "connected":
    case "done":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "protected":
      return "border-sky-400/25 bg-sky-400/10 text-sky-200";
    case "integration":
    case "ready":
    case "running":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
    case "development":
    case "in_development":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";
    case "pending":
    case "queued":
    case "needs_approval":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "blocked":
    case "error":
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
    case "not_created":
    case "canceled":
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
    default:
      return "border-white/10 bg-white/[0.04] text-slate-300";
  }
}

export function getAppStatus(status: string): AppStatus {
  if (["live", "protected", "integration", "development", "pending", "blocked", "not_created"].includes(status)) {
    return status as AppStatus;
  }
  if (status === "ready") return "integration";
  if (status === "in_development") return "development";
  return "development";
}

export function getNodeStatus(status: string): NodeStatus {
  return getAppStatus(status);
}

export function getStatusHelp(status: string): string {
  switch (status) {
    case "live":
    case "connected":
      return "Funciona y puede usarse.";
    case "protected":
      return "Existe, pero sus acciones sensibles están cerradas por seguridad.";
    case "integration":
    case "ready":
      return "Tiene base real y está conectándose por etapas.";
    case "development":
    case "in_development":
      return "Está en construcción o ajuste técnico.";
    case "pending":
      return "Está planeado o visualmente listo, pero falta conexión funcional.";
    case "blocked":
      return "La acción real está detenida intencionalmente.";
    case "not_created":
      return "Aún no hay módulo funcional.";
    default:
      return "Estado en revisión.";
  }
}
