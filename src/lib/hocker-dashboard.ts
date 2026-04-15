import { type ExternalServiceItem } from "@/lib/external-services";

export type AppStatus = "live" | "ready" | "in_development";
export type NodeStatus = "live" | "ready" | "in_development";

export type AppRegistryItem = { key: string; title: string; subtitle: string; integration: string; projectId: string; status: AppStatus; note: string; };
export type AgiRegistryItem = { key: string; title: string; subtitle: string; nodeId: string; integration: string; status: NodeStatus; note: string; };
export type RepoRegistryItem = { key: string; title: string; subtitle: string; branch: string; status: "connected" | "pending"; note: string; };
export type DashboardMetric = { label: string; value: string; hint: string; };
export type DashboardEventItem = { id: string; title: string; detail: string; level: "info" | "warn" | "error"; at: string; };
export type DashboardCommandItem = { id: string; command: string; projectId: string; status: string; createdAt: string; };

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
  { key: "hocker-one", title: "Hocker ONE", subtitle: "Centro de mando.", integration: "NOVA + Syntia", projectId: "hocker-one", status: "live", note: "Activo." },
  { key: "chido-casino", title: "Chido Casino", subtitle: "Gaming IA.", integration: "Chido Wins", projectId: "chido-casino", status: "live", note: "Desarrollo real." }
];

export const AGI_REGISTRY: AgiRegistryItem[] = [
  { key: "nova", title: "NOVA", subtitle: "Conciencia Central.", nodeId: "nova", integration: "Core", status: "live", note: "En línea." }
];

export const REPO_REGISTRY: RepoRegistryItem[] = [
  { key: "hocker-one", title: "hocker.one", subtitle: "Repo principal.", branch: "main", status: "connected", note: "Sincronizado." }
];

export function getStatusLabel(status: string) { return status === "live" || status === "connected" ? "Activo" : "Desarrollo"; }
export function getStatusTone(status: string) { return status === "live" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-400"; }
