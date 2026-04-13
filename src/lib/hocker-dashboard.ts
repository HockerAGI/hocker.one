import { createServerSupabase } from "@/lib/supabase-server";

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
  recentEvents: DashboardEventItem[];
  recentCommands: DashboardCommandItem[];
};

type RawProject = {
  id: string;
  name: string | null;
  created_at: string;
};

type RawNode = {
  id: string;
  project_id: string;
  name: string | null;
  status: string | null;
};

type RawEvent = {
  id: string;
  project_id: string;
  level: string | null;
  type: string;
  message: string;
  created_at: string;
};

type RawCommand = {
  id: string;
  project_id: string;
  command: string;
  status: string;
  created_at: string;
};

type RawOrder = {
  id: string;
  project_id: string;
  status: string;
  total_cents: number;
  created_at: string;
};

type SnapshotRow = {
  snapshot_at: string;
  total_projects: number;
  known_projects: number;
  total_nodes: number;
  live_nodes: number;
  events_24h: number;
  queued_commands: number;
  gross_revenue_cents: number;
  last_event_at: string;
};

const APP_REGISTRY: AppRegistryItem[] = [
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
    subtitle: "Publicidad, branding y automatización.",
    integration: "Nova Ads + Candy Ads + PRO IA",
    projectId: "hocker-ads",
    status: "ready",
    note: "Definido en documentación.",
  },
  {
    key: "hocker-hub",
    title: "Hocker Hub",
    subtitle: "CRM y flujo comercial.",
    integration: "Nova Ads + Numia",
    projectId: "hocker-hub",
    status: "ready",
    note: "Listo para conectar.",
  },
  {
    key: "hocker-drive-cloud",
    title: "Hocker Drive Cloud",
    subtitle: "Almacenamiento y sincronía.",
    integration: "Vertx + Syntia",
    projectId: "hocker-drive-cloud",
    status: "ready",
    note: "Listo para conectar.",
  },
  {
    key: "hocker-up",
    title: "Hocker Up",
    subtitle: "Aprendizaje y red social.",
    integration: "Candy Ads + Syntia",
    projectId: "hocker-up",
    status: "ready",
    note: "Listo para conectar.",
  },
  {
    key: "trackhok",
    title: "Trackhok",
    subtitle: "Rastreo y monitoreo.",
    integration: "Trackhok + Vertx",
    projectId: "trackhok",
    status: "in_development",
    note: "Pendiente de integración completa.",
  },
  {
    key: "nexpa",
    title: "NEXPA",
    subtitle: "Control parental y seguridad invisible.",
    integration: "NEXPA + Trackhok",
    projectId: "nexpa",
    status: "in_development",
    note: "Pendiente de integración completa.",
  },
  {
    key: "hocker-wallet",
    title: "Hocker Wallet",
    subtitle: "Pagos y compliance financiero.",
    integration: "Numia + Jurix",
    projectId: "hocker-wallet",
    status: "ready",
    note: "Listo para conectar.",
  },
  {
    key: "hocker-supply",
    title: "Hocker Supply",
    subtitle: "Manufactura y operación bajo demanda.",
    integration: "Hostia + Numia + Jurix",
    projectId: "hocker-supply",
    status: "in_development",
    note: "Pendiente de integración completa.",
  },
];

const AGI_REGISTRY: AgiRegistryItem[] = [
  { key: "nova", title: "NOVA", subtitle: "Conciencia central.", nodeId: "nova", integration: "Gobernanza total", status: "live", note: "Núcleo principal activo." },
  { key: "syntia", title: "Syntia", subtitle: "Sincronía y memoria.", nodeId: "syntia", integration: "Mirror node", status: "live", note: "Núcleo principal activo." },
  { key: "vertx", title: "Vertx", subtitle: "Seguridad y blockchain.", nodeId: "vertx", integration: "Shield node", status: "live", note: "Núcleo principal activo." },
  { key: "numia", title: "Numia", subtitle: "Finanzas y ROI.", nodeId: "numia", integration: "Finance core", status: "live", note: "Núcleo principal activo." },
  { key: "jurix", title: "Jurix", subtitle: "Legalidad y cumplimiento.", nodeId: "jurix", integration: "Legal ledger", status: "live", note: "Núcleo principal activo." },
  { key: "hostia", title: "Hostia", subtitle: "APIs, hosting y tokens.", nodeId: "hostia", integration: "Bridge node", status: "live", note: "Núcleo principal activo." },
  { key: "candy-ads", title: "Candy Ads", subtitle: "Creatividad visual.", nodeId: "candy-ads", integration: "Creative node", status: "live", note: "Núcleo operativo activo." },
  { key: "nova-ads", title: "Nova Ads", subtitle: "Campañas y estrategia.", nodeId: "nova-ads", integration: "Ads core", status: "live", note: "Núcleo operativo activo." },
  { key: "pro-ia", title: "PRO IA", subtitle: "Video, voz y motion.", nodeId: "pro-ia", integration: "Video node", status: "live", note: "Núcleo operativo activo." },
  { key: "curvewind", title: "Curvewind", subtitle: "Estrategia y proyección.", nodeId: "curvewind", integration: "Prediction core", status: "ready", note: "Definido en documentación." },
  { key: "chido-wins", title: "Chido Wins", subtitle: "Predicción y validación.", nodeId: "chido-wins", integration: "Game core", status: "ready", note: "Existe parte real en el repo." },
  { key: "chido-gerente", title: "Chido Gerente", subtitle: "Operación del casino.", nodeId: "chido-gerente", integration: "Ops core", status: "ready", note: "Existe parte real en el repo." },
  { key: "trackhok", title: "Trackhok IA", subtitle: "Monitoreo y predicción.", nodeId: "trackhok", integration: "Analytics node", status: "in_development", note: "Pendiente de integración completa." },
  { key: "nexpa", title: "NEXPA", subtitle: "Control ético invisible.", nodeId: "nexpa", integration: "Guard node", status: "in_development", note: "Pendiente de integración completa." },
  { key: "shadows", title: "Shadows", subtitle: "Capa efímera temporal.", nodeId: "shadows", integration: "Micro tasks", status: "in_development", note: "Disponible solo como capa futura." },
];

const REPO_REGISTRY: RepoRegistryItem[] = [
  {
    key: "hocker-node-agent",
    title: "hocker-node-agent",
    subtitle: "Nodo agente real existente.",
    branch: "main",
    status: "connected",
    note: "Repositorio presente y listo para enlazar.",
  },
  {
    key: "nova-agi",
    title: "nova.agi",
    subtitle: "Repositorio de la conciencia central.",
    branch: "main",
    status: "connected",
    note: "Repositorio presente y listo para enlazar.",
  },
];

function money(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function timeLabel(input: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(input));
}

function statusFromProjects(
  projectIds: Set<string>,
  item: { key: string; projectId?: string; status: AppStatus | NodeStatus },
): AppStatus | NodeStatus {
  const pid = item.projectId ?? item.key;
  if (projectIds.has(pid)) return "live";
  return item.status;
}

export async function buildDashboardSummary(): Promise<DashboardSummary> {
  const sb = await createServerSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    snapshotRes,
    projectsRes,
    nodesRes,
    eventsRes,
    commandsRes,
    ordersRes,
  ] = await Promise.all([
    sb.from("hocker_dashboard_snapshot").select("*").maybeSingle<SnapshotRow>(),
    sb.from("projects").select("id,name,created_at"),
    sb.from("nodes").select("id,project_id,name,status"),
    sb.from("events").select("id,project_id,level,type,message,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(12),
    sb.from("commands").select("id,project_id,command,status,created_at").order("created_at", { ascending: false }).limit(12),
    sb.from("supply_orders").select("id,project_id,status,total_cents,created_at"),
  ]);

  const snapshot = snapshotRes.data ?? {
    snapshot_at: new Date().toISOString(),
    total_projects: 0,
    known_projects: 0,
    total_nodes: 0,
    live_nodes: 0,
    events_24h: 0,
    queued_commands: 0,
    gross_revenue_cents: 0,
    last_event_at: new Date().toISOString(),
  };

  const projects = (projectsRes.data ?? []) as RawProject[];
  const nodes = (nodesRes.data ?? []) as RawNode[];
  const events = (eventsRes.data ?? []) as RawEvent[];
  const commands = (commandsRes.data ?? []) as RawCommand[];
  const orders = (ordersRes.data ?? []) as RawOrder[];

  const projectIds = new Set(projects.map((project) => project.id));

  const apps = APP_REGISTRY.map((item) => ({
    ...item,
    status: statusFromProjects(projectIds, item) as AppStatus,
  }));

  const agis = AGI_REGISTRY.map((item) => ({
    ...item,
    status: statusFromProjects(projectIds, item) as NodeStatus,
  }));

  const liveNodes = nodes.filter((node) => String(node.status ?? "").toLowerCase() === "online").length;
  const revenueCents = orders.reduce((sum, order) => sum + Number(order.total_cents ?? 0), 0);
  const queuedCommands = commands.filter((command) => ["queued", "pending", "needs_approval"].includes(command.status)).length;

  const metrics: DashboardMetric[] = [
    { label: "Proyectos", value: String(snapshot.total_projects ?? projects.length), hint: "Apps y espacios registrados" },
    { label: "Nodos vivos", value: String(snapshot.live_nodes ?? liveNodes), hint: "Infraestructura con señal activa" },
    { label: "Eventos 24 h", value: String(snapshot.events_24h ?? events.length), hint: "Actividad reciente real" },
    { label: "Movimientos", value: money(Number(snapshot.gross_revenue_cents ?? revenueCents)), hint: "Órdenes y flujo económico" },
  ];

  const recentEvents: DashboardEventItem[] = events.map((event) => ({
    id: event.id,
    title: event.type,
    detail: event.message,
    level: (event.level === "warn" || event.level === "error" ? event.level : "info") as "info" | "warn" | "error",
    at: timeLabel(event.created_at),
  }));

  const recentCommands: DashboardCommandItem[] = commands.map((command) => ({
    id: command.id,
    command: command.command,
    projectId: command.project_id,
    status: command.status,
    createdAt: timeLabel(command.created_at),
  }));

  return {
    snapshotAt: snapshot.snapshot_at ?? new Date().toISOString(),
    metrics,
    apps,
    agis,
    repos: REPO_REGISTRY,
    recentEvents,
    recentCommands,
  };
}

export function getStatusLabel(status: AppStatus | NodeStatus | "connected" | "pending"): string {
  switch (status) {
    case "live":
    case "connected":
      return "Activo";
    case "ready":
      return "Listo";
    case "in_development":
    case "pending":
    default:
      return "En desarrollo";
  }
}

export function getStatusTone(status: AppStatus | NodeStatus | "connected" | "pending"): string {
  switch (status) {
    case "live":
    case "connected":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    case "ready":
      return "bg-sky-500/15 text-sky-300 border-sky-400/20";
    case "in_development":
    case "pending":
    default:
      return "bg-white/5 text-slate-300 border-white/10";
  }
}