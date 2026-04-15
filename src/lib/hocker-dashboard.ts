import { type ExternalServiceItem } from "@/lib/external-services";

export type AppStatus = "live" | "ready" | "in_development";
export type NodeStatus = "live" | "ready" | "in_development";

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
  status: "connected" | "pending";
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
  level: "info" | "warn" | "error";
  at: string;
};

export type DashboardCommandItem = {
  id: string;
  command: string;
  projectId: string;
  status: string;
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
    integration: "NOVA + Syntia + Vertx",
    projectId: "hocker-one",
    status: "live",
    note: "Panel principal activo.",
  },
  {
    key: "chido-casino",
    title: "Chido Casino",
    subtitle: "Nodo de gaming y apuestas inteligentes.",
    integration: "Curvewind + Chido Wins + Chido Gerente",
    projectId: "chido-casino",
    status: "live",
    note: "Existe una parte real en desarrollo.",
  },
  {
    key: "hocker-ads",
    title: "Hocker Ads",
    subtitle: "Motor central de IA para publicidad.",
    integration: "Hocker Ads Engine",
    projectId: "hocker-ads",
    status: "in_development",
    note: "Fase de pruebas.",
  }
];

export const AGI_REGISTRY: AgiRegistryItem[] = [
  {
    key: "nova",
    title: "NOVA",
    subtitle: "Inteligencia Central Suprema",
    nodeId: "nova-core",
    integration: "Hocker ONE",
    status: "live",
    note: "Conciencia operativa en línea.",
  },
  {
    key: "syntia",
    title: "Syntia",
    subtitle: "IA Táctica Financiera",
    nodeId: "syntia-node",
    integration: "Hocker ONE",
    status: "live",
    note: "Sistemas contables sincronizados.",
  }
];

export const REPO_REGISTRY: RepoRegistryItem[] = [
  {
    key: "hocker-one-repo",
    title: "Hocker ONE Repo",
    subtitle: "github.com/HockerAGI/hocker.one",
    branch: "main",
    status: "connected",
    note: "Sincronizado vía Vercel.",
  }
];

export function getStatusLabel(status: string) {
  switch (status) {
    case "live":
    case "connected":
      return "En Línea";
    case "ready":
      return "Preparado";
    case "in_development":
    case "pending":
      return "En Desarrollo";
    default:
      return "Desconocido";
  }
}

export function getStatusTone(status: string) {
  switch (status) {
    case "live":
    case "connected":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "ready":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "in_development":
    case "pending":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}