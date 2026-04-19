import type { ExternalServiceItem } from "@/lib/external-services";

export type AppStatus = "live" | "ready" | "in_development";
export type NodeStatus = "live" | "ready" | "in_development";
export type RepoStatus = "connected" | "pending";
export type CommandStatus = "done" | "running" | "queued" | "needs_approval" | "error" | "canceled";
export type EventLevel = "info" | "warn" | "error";

export type AppRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  integration: string;
  projectId: string;
  status: AppStatus;
  note: string;
};

export type AgiRegistryItem = {
  key: string;
  title: string;
  subtitle: string;
  nodeId: string;
  integration: string;
  status: NodeStatus;
  note: string;
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
    subtitle: "Centro de mando del ecosistema.",
    integration: "NOVA + Syntia",
    projectId: "hocker-one",
    status: "live",
    note: "Activo en producción.",
  },
  {
    key: "chido-casino",
    title: "Chido Casino",
    subtitle: "Operación de gaming con IA.",
    integration: "Chido Wins + Chido Gerente",
    projectId: "chido-casino",
    status: "ready",
    note: "Arquitectura conectada.",
  },
  {
    key: "trackhok",
    title: "Trackhok",
    subtitle: "Rastreo inteligente y predictivo.",
    integration: "Shadow IA",
    projectId: "trackhok",
    status: "in_development",
    note: "En expansión funcional.",
  },
];

export const AGI_REGISTRY: AgiRegistryItem[] = [
  {
    key: "nova",
    title: "NOVA",
    subtitle: "Conciencia central.",
    nodeId: "nova",
    integration: "Core",
    status: "live",
    note: "Orquestación principal.",
  },
  {
    key: "vertx",
    title: "VERTX",
    subtitle: "Auditoría y trazabilidad.",
    nodeId: "vertx",
    integration: "Compliance",
    status: "ready",
    note: "Observabilidad lista.",
  },
  {
    key: "numia",
    title: "NUMIA",
    subtitle: "Control financiero.",
    nodeId: "numia",
    integration: "Finance",
    status: "ready",
    note: "Movimientos y control.",
  },
  {
    key: "hostia",
    title: "HOSTIA",
    subtitle: "Infraestructura y despliegue.",
    nodeId: "hostia",
    integration: "Infra",
    status: "in_development",
    note: "Nodo en estabilización.",
  },
];

export const REPO_REGISTRY: RepoRegistryItem[] = [
  {
    key: "hocker-one",
    title: "hocker.one",
    subtitle: "Control plane principal.",
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
    note: "API y memoria activas.",
  },
  {
    key: "hocker-node-agent",
    title: "hocker-node-agent",
    subtitle: "Ejecutor físico seguro.",
    branch: "main",
    status: "connected",
    note: "Nodo operativo en sandbox.",
  },
];

export function getStatusLabel(status: string): string {
  switch (status) {
    case "live":
    case "connected":
      return "Activo";
    case "ready":
      return "Listo";
    case "in_development":
      return "Desarrollo";
    case "pending":
      return "Pendiente";
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
      return "Desarrollo";
  }
}

export function getStatusTone(status: string): string {
  switch (status) {
    case "live":
    case "connected":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "ready":
      return "bg-sky-500/10 text-sky-300 border-sky-400/20";
    case "in_development":
    case "pending":
      return "bg-white/5 text-slate-300 border-white/10";
    case "error":
      return "bg-rose-500/10 text-rose-300 border-rose-400/20";
    case "running":
    case "queued":
    case "needs_approval":
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
    case "done":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "canceled":
      return "bg-slate-500/10 text-slate-300 border-slate-400/20";
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}

export function getAppStatus(status: string): AppStatus {
  if (status === "live" || status === "ready" || status === "in_development") return status;
  return "in_development";
}

export function getNodeStatus(status: string): NodeStatus {
  if (status === "live" || status === "ready" || status === "in_development") return status;
  return "in_development";
}