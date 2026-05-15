import type { ExternalServiceItem } from "@/lib/external-services";

export type AppStatus = "live" | "ready" | "protected" | "in_development" | "pending" | "blocked" | "not_created";
export type NodeStatus = "live" | "ready" | "protected" | "in_development" | "pending" | "blocked" | "not_created";
export type RepoStatus = "connected" | "pending";
export type CommandStatus = "done" | "running" | "queued" | "needs_approval" | "error" | "canceled";
export type EventLevel = "info" | "warn" | "error";

export type AppCategory = "control" | "negocio" | "operacion" | "especiales";
export type AgiCategory = "nucleo" | "tridente" | "creativas" | "operativas";

export type AppRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  integration: string;
  projectId: string;
  status: AppStatus;
  note: string;
  href: string;
  category: AppCategory;
  logoSrc?: string;
};

export type AgiRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  nodeId: string;
  integration: string;
  status: NodeStatus;
  note: string;
  href: string;
  category: AgiCategory;
  logoSrc?: string;
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

export const APP_REGISTRY: AppRegistryItem[] = [
  {
    key: "hocker-one",
    title: "Hocker ONE",
    subtitle: "Panel maestro del ecosistema.",
    integration: "NOVA + Syntia + Vertx",
    projectId: "hocker-one",
    status: "live",
    note: "Activo y validado con build, typecheck y producción.",
    href: "/owner",
    category: "control",
    logoSrc: "/ecosystem/apps/hocker-one/icon.png",
  },
  {
    key: "hocker-ads",
    title: "Hocker Ads",
    subtitle: "Publicidad y contenido con IA.",
    integration: "Nova Ads + Candy Ads + PRO IA",
    projectId: "hocker-ads",
    status: "ready",
    note: "Base visual lista; integración operativa en curso.",
    href: "/servicios",
    category: "negocio",
    logoSrc: "/ecosystem/apps/hocker-ads/icon.png",
  },
  {
    key: "chido-casino",
    title: "Chido Casino",
    subtitle: "Casino IA en revisión segura.",
    integration: "Chido Gerente + Chido Wins",
    projectId: "chido-casino",
    status: "protected",
    note: "Existe código sensible. Se mantiene sin ejecución real desde Hocker ONE.",
    href: "/chido",
    category: "especiales",
    logoSrc: "/ecosystem/apps/chido-casino/icon.png",
  },
  {
    key: "trackhok",
    title: "TrackHok",
    subtitle: "Rastreo y monitoreo autorizado.",
    integration: "TrackHok AGI + Vertx",
    projectId: "trackhok",
    status: "in_development",
    note: "Línea de app en desarrollo; requiere conexión funcional real.",
    href: "/integrations",
    category: "especiales",
    logoSrc: "/ecosystem/apps/trackhok/icon.png",
  },
  {
    key: "hocker-wallet",
    title: "Hocker Wallet",
    subtitle: "Pagos y control financiero.",
    integration: "Numia + Jurix",
    projectId: "hocker-wallet",
    status: "pending",
    note: "Identidad visual lista; falta módulo financiero completo.",
    href: "/dashboard",
    category: "operacion",
    logoSrc: "/ecosystem/apps/hocker-wallet/icon.png",
  },
  {
    key: "nexpa-app",
    title: "NEXPA App",
    subtitle: "Seguridad y control familiar.",
    integration: "NEXPA AGI + TrackHok AGI",
    projectId: "nexpa-app",
    status: "in_development",
    note: "Concepto y marca listos; funciones sensibles requieren versión ética y autorizada.",
    href: "/security",
    category: "especiales",
    logoSrc: "/ecosystem/apps/nexpa-app/icon.png",
  },
  {
    key: "hocker-drive-cloud",
    title: "Hocker Drive Cloud",
    subtitle: "Nube privada y respaldos.",
    integration: "Syntia + Vertx",
    projectId: "hocker-drive-cloud",
    status: "pending",
    note: "Base visual lista; falta almacenamiento productivo conectado.",
    href: "/integrations",
    category: "operacion",
    logoSrc: "/ecosystem/apps/hocker-drive-cloud/icon.png",
  },
  {
    key: "hocker-hub",
    title: "Hocker Hub",
    subtitle: "CRM para ventas y clientes.",
    integration: "Revia AGI + Nova Ads + Numia",
    projectId: "hocker-hub",
    status: "pending",
    note: "Marca lista; CRM funcional pendiente de integración.",
    href: "/access",
    category: "negocio",
    logoSrc: "/ecosystem/apps/hocker-hub/icon.png",
  },
  {
    key: "hocker-up",
    title: "Hocker Up",
    subtitle: "Aprendizaje y comunidad.",
    integration: "Syntia + Candy Ads",
    projectId: "hocker-up",
    status: "pending",
    note: "Marca lista; plataforma social/eLearning pendiente.",
    href: "/servicios",
    category: "especiales",
    logoSrc: "/ecosystem/apps/hocker-up/icon.png",
  },
  {
    key: "hocker-supply",
    title: "HKR Supply / Hocker Supply",
    subtitle: "Tienda y productos del ecosistema.",
    integration: "Supply + Hocker Store",
    projectId: "hocker-supply",
    status: "ready",
    note: "Pack visual cerrado; base de tienda en integración.",
    href: "/supply",
    category: "negocio",
    logoSrc: "/ecosystem/apps/hocker-supply/icon.png",
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
    note: "Núcleo central de coordinación.",
    href: "/chat",
    category: "nucleo",
    logoSrc: "/ecosystem/agis/nova/icon.png",
  },
  {
    key: "syntia",
    title: "Syntia",
    subtitle: "Memoria y sincronización.",
    nodeId: "syntia",
    integration: "Memoria",
    status: "ready",
    note: "Base estratégica definida; integración de memoria en curso.",
    href: "/memory",
    category: "tridente",
  },
  {
    key: "vertx",
    title: "Vertx",
    subtitle: "Seguridad y auditoría.",
    nodeId: "vertx",
    integration: "Seguridad",
    status: "ready",
    note: "Base de control y auditoría integrada en Hocker ONE.",
    href: "/security",
    category: "tridente",
  },
  {
    key: "curvewind",
    title: "Curvewind",
    subtitle: "Estrategia y predicción.",
    nodeId: "curvewind",
    integration: "Predicción",
    status: "in_development",
    note: "Definida como AGI estratégica; falta módulo operativo real.",
    href: "/agis",
    category: "tridente",
  },
  {
    key: "nova-ads",
    title: "Nova Ads",
    subtitle: "Campañas y anuncios.",
    nodeId: "nova-ads",
    integration: "Ads",
    status: "in_development",
    note: "Rol publicitario definido; automatización completa pendiente.",
    href: "/servicios",
    category: "creativas",
  },
  {
    key: "candy-ads",
    title: "Candy Ads",
    subtitle: "Diseño visual y creatividad.",
    nodeId: "candy-ads",
    integration: "Creatividad",
    status: "in_development",
    note: "Rol creativo definido; sistema visual en expansión.",
    href: "/agis",
    category: "creativas",
  },
  {
    key: "pro-ia",
    title: "PRO IA",
    subtitle: "Video, audio y producción.",
    nodeId: "pro-ia",
    integration: "Producción",
    status: "in_development",
    note: "Rol audiovisual definido; pipeline productivo pendiente.",
    href: "/agis",
    category: "creativas",
  },
  {
    key: "revia",
    title: "Revia AGI",
    subtitle: "Atención, soporte y ventas.",
    nodeId: "revia",
    integration: "Soporte",
    status: "in_development",
    note: "AGI para clientes, soporte comercial y seguimiento de ventas.",
    href: "/access",
    category: "creativas",
  },
  {
    key: "hostia",
    title: "Hostia",
    subtitle: "Servidores y conexiones.",
    nodeId: "hostia",
    integration: "Infraestructura",
    status: "in_development",
    note: "Base conceptual definida; automatización de infraestructura pendiente.",
    href: "/integrations",
    category: "operativas",
  },
  {
    key: "jurix",
    title: "Jurix",
    subtitle: "Legal y contratos.",
    nodeId: "jurix",
    integration: "Legal",
    status: "in_development",
    note: "Rol legal definido; módulo operativo pendiente.",
    href: "/governance",
    category: "operativas",
  },
  {
    key: "numia",
    title: "Numia",
    subtitle: "Finanzas y control.",
    nodeId: "numia",
    integration: "Finanzas",
    status: "ready",
    note: "Base financiera visible en dashboard; integración completa pendiente.",
    href: "/dashboard",
    category: "operativas",
  },
  {
    key: "chido-wins",
    title: "Chido Wins",
    subtitle: "Predicción y riesgo responsable.",
    nodeId: "chido-wins",
    integration: "Chido Casino",
    status: "protected",
    note: "Solo análisis y simulación responsable. Sin ejecución real desde Hocker ONE.",
    href: "/chido",
    category: "operativas",
  },
  {
    key: "chido-gerente",
    title: "Chido Gerente",
    subtitle: "Operación de Chido Casino.",
    nodeId: "chido-gerente",
    integration: "Chido Casino",
    status: "protected",
    note: "Operación sensible bajo bloqueo y revisión segura.",
    href: "/chido/ops",
    category: "operativas",
  },
  {
    key: "nexpa-agi",
    title: "NEXPA AGI",
    subtitle: "Seguridad familiar inteligente.",
    nodeId: "nexpa-agi",
    integration: "Seguridad",
    status: "in_development",
    note: "Funciones sensibles requieren diseño ético, consentimiento y autorización.",
    href: "/security",
    category: "operativas",
  },
  {
    key: "trackhok-agi",
    title: "TrackHok AGI",
    subtitle: "Rastreo autorizado y monitoreo.",
    nodeId: "trackhok-agi",
    integration: "Monitoreo",
    status: "in_development",
    note: "Rastreo solo autorizado; módulo predictivo pendiente.",
    href: "/integrations",
    category: "operativas",
  },
];

export const REPO_REGISTRY: RepoRegistryItem[] = [
  {
    key: "hocker-one",
    title: "hocker.one",
    subtitle: "Panel maestro principal.",
    branch: "main",
    status: "connected",
    note: "Sincronizado con despliegue.",
  },
  {
    key: "nova.agi",
    title: "nova.agi",
    subtitle: "Núcleo conversacional.",
    branch: "main",
    status: "connected",
    note: "API y memoria en evolución.",
  },
  {
    key: "hocker-node-agent",
    title: "hocker-node-agent",
    subtitle: "Ejecutor físico seguro.",
    branch: "main",
    status: "connected",
    note: "Nodo operativo en sandbox.",
  },
  {
    key: "chido-casino",
    title: "chido.casino",
    subtitle: "Casino IA protegido.",
    branch: "main",
    status: "connected",
    note: "Código sensible. Mantener con bloqueo y compliance.",
  },
];

export function getStatusLabel(status: string): string {
  switch (status) {
    case "live":
    case "connected":
      return "Activo";
    case "ready":
      return "En integración";
    case "protected":
      return "Protegido";
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
      return "Error";
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
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "ready":
      return "bg-cyan-500/10 text-cyan-300 border-cyan-400/20";
    case "protected":
      return "bg-sky-500/10 text-sky-300 border-sky-400/20";
    case "in_development":
      return "bg-violet-500/10 text-violet-300 border-violet-400/20";
    case "pending":
    case "queued":
    case "running":
    case "needs_approval":
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
    case "blocked":
    case "error":
      return "bg-rose-500/10 text-rose-300 border-rose-400/20";
    case "not_created":
    case "canceled":
      return "bg-slate-500/10 text-slate-300 border-slate-400/20";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

export function getAppStatus(status: string): AppStatus {
  if (["live", "ready", "protected", "in_development", "pending", "blocked", "not_created"].includes(status)) return status as AppStatus;
  return "in_development";
}

export function getNodeStatus(status: string): NodeStatus {
  if (["live", "ready", "protected", "in_development", "pending", "blocked", "not_created"].includes(status)) return status as NodeStatus;
  return "in_development";
}
