import { AGI_REGISTRY } from "@/lib/hocker-dashboard";
import { AGI_QUEUE_BLOCKING_STATUSES } from "@/lib/agi-queue-lock";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getVerifiedAgiRuntimeSummary } from "@/lib/verified-agi-runtime";

export type OperationalStatus =
  | "online"
  | "degraded"
  | "configured"
  | "stale"
  | "offline"
  | "protected"
  | "not_created"
  | "planned"
  | "unknown";

export type OperationalApp = {
  key: string;
  title: string;
  kind: "panel" | "website" | "application" | "module";
  status: OperationalStatus;
  summary: string;
  evidence: string;
  href: string | null;
  repository: string | null;
  last_activity_at: string | null;
  checked_at: string;
};

export type OperationalAgi = {
  key: string;
  title: string;
  role: string;
  group: string;
  status: OperationalStatus;
  registry_status: string | null;
  evidence: string;
  last_activity_at: string | null;
  last_run_status: string | null;
  worker_id: string | null;
  checked_at: string;
};

export type OperationalSnapshot = {
  ok: boolean;
  checked_at: string;
  source: "supabase+health" | "partial";
  apps: OperationalApp[];
  agis: OperationalAgi[];
  metrics: {
    verified_services: number;
    configured_tools: number;
    fresh_nodes: number;
    runs_24h: number;
    pending_actions: number;
  };
  runtime: Awaited<ReturnType<typeof getVerifiedAgiRuntimeSummary>>;
};

type AgentRow = { agi_id: string; status: string | null; updated_at: string | null };
type RunRow = {
  agi_id: string | null;
  status: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  worker_id: string | null;
};
type NodeRow = { id: string; project_id: string; status: string | null; last_seen_at: string | null };
type WebsiteHealth = { online: boolean; checkedAt: string };
type OperationalData = {
  agents: AgentRow[];
  latestRunByAgi: Map<string, RunRow>;
  nodes: NodeRow[];
  pendingActions: number;
  runs24h: number;
  databaseOk: boolean;
};

const AGI_RUNTIME_FRESH_MS = 30 * 60 * 1000;
const NODE_FRESH_MS = 5 * 60 * 1000;
const WEBSITE_HEALTH_TTL_MS = 60 * 1000;
const NOT_CREATED_APPS: Array<[string, string, string]> = [
  ["hocker-ads", "Hocker Ads", "Aplicación de publicidad aún no creada."],
  ["hocker-hub", "Hocker Hub", "CRM aún no creado."],
  ["hocker-wallet", "Hocker Wallet", "Aplicación financiera aún no creada."],
  ["hocker-drive-cloud", "Hocker Drive Cloud", "Aplicación de nube aún no creada."],
  ["trackhok", "TrackHok", "Aplicación de rastreo aún no creada."],
  ["nexpa-app", "NEXPA App", "Aplicación de seguridad aún no creada."],
  ["hocker-up", "Hocker Up", "Aplicación educativa aún no creada."],
];

let websiteHealthCache: { url: string; expiresAt: number; value: WebsiteHealth } | null = null;

function canonicalAgiId(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-")
    .replace(/^candy$/, "candy-ads")
    .replace(/^nexpa$/, "nexpa-agi")
    .replace(/^trackhok$/, "trackhok-agi");
}

function agiIdCandidates(value: string): string[] {
  const canonical = canonicalAgiId(value);
  const candidates = new Set([
    value,
    value.replaceAll("-", "_"),
    canonical,
    canonical.replaceAll("-", "_"),
  ]);

  if (canonical === "candy-ads") candidates.add("candy");
  if (canonical === "nexpa-agi") candidates.add("nexpa");
  if (canonical === "trackhok-agi") candidates.add("trackhok");

  return [...candidates].filter(Boolean);
}

function newestDate(...values: Array<string | null | undefined>): string | null {
  return values
    .filter((value): value is string => Boolean(value))
    .filter((value) => Number.isFinite(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function isFresh(value: string | null, maxAgeMs: number): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time <= maxAgeMs;
}

function isSuccessfulRun(status: string | null): boolean {
  return ["done", "completed", "success", "succeeded"].includes(String(status ?? "").toLowerCase());
}

function isFailedRun(status: string | null): boolean {
  return ["error", "failed", "execution_failed", "cancelled", "canceled"].includes(String(status ?? "").toLowerCase());
}

async function checkPublicWebsite(url: string): Promise<WebsiteHealth> {
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/html" },
    });
    return { online: response.ok, checkedAt };
  } catch {
    return { online: false, checkedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function getCachedWebsiteHealth(url: string): Promise<WebsiteHealth> {
  if (websiteHealthCache && websiteHealthCache.url === url && websiteHealthCache.expiresAt > Date.now()) {
    return websiteHealthCache.value;
  }

  const value = await checkPublicWebsite(url);
  websiteHealthCache = { url, value, expiresAt: Date.now() + WEBSITE_HEALTH_TTL_MS };
  return value;
}

async function loadOperationalData(projectId: string): Promise<OperationalData> {
  try {
    const sb = createAdminSupabase();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const corePromise = Promise.all([
      sb.from("agi_agents").select("agi_id,status,updated_at").eq("project_id", projectId),
      sb.from("nodes").select("id,project_id,status,last_seen_at"),
      sb
        .from("agi_action_queue")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .in("status", [...AGI_QUEUE_BLOCKING_STATUSES]),
      sb
        .from("agi_runs")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .gte("created_at", since24h),
    ]);

    const latestRunsPromise = Promise.all(AGI_REGISTRY.map(async (definition) => {
      const result = await sb
        .from("agi_runs")
        .select("agi_id,status,created_at,started_at,finished_at,worker_id")
        .eq("project_id", projectId)
        .in("agi_id", agiIdCandidates(definition.key))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        key: canonicalAgiId(definition.key),
        row: (result.data ?? null) as RunRow | null,
        error: result.error,
      };
    }));

    const [[agentsRes, nodesRes, actionsRes, runs24hRes], latestRuns] = await Promise.all([
      corePromise,
      latestRunsPromise,
    ]);

    const latestRunByAgi = new Map<string, RunRow>();
    for (const result of latestRuns) {
      if (result.row) latestRunByAgi.set(result.key, result.row);
    }

    const databaseOk =
      !agentsRes.error &&
      !nodesRes.error &&
      !actionsRes.error &&
      !runs24hRes.error &&
      latestRuns.every((result) => !result.error);

    return {
      agents: (agentsRes.data ?? []) as AgentRow[],
      latestRunByAgi,
      nodes: (nodesRes.data ?? []) as NodeRow[],
      pendingActions: actionsRes.count ?? 0,
      runs24h: runs24hRes.count ?? 0,
      databaseOk,
    };
  } catch {
    return {
      agents: [],
      latestRunByAgi: new Map<string, RunRow>(),
      nodes: [],
      pendingActions: 0,
      runs24h: 0,
      databaseOk: false,
    };
  }
}

export async function getHockerOperationalSnapshot(projectId = "hocker-one"): Promise<OperationalSnapshot> {
  const checkedAt = new Date().toISOString();
  const [runtime, websiteHealth, operationalData] = await Promise.all([
    getVerifiedAgiRuntimeSummary(projectId),
    getCachedWebsiteHealth("https://hockeragi.vercel.app"),
    loadOperationalData(projectId),
  ]);

  const { agents, latestRunByAgi, nodes, pendingActions, runs24h, databaseOk } = operationalData;

  const canonicalAgents = new Map<string, AgentRow>();
  for (const agent of agents) canonicalAgents.set(canonicalAgiId(agent.agi_id), agent);

  const agis: OperationalAgi[] = AGI_REGISTRY.map((definition) => {
    const key = canonicalAgiId(definition.key);
    const registry = canonicalAgents.get(key);
    const latestRun = latestRunByAgi.get(key);
    const lastActivityAt = latestRun
      ? newestDate(latestRun.finished_at, latestRun.started_at, latestRun.created_at)
      : null;

    let status: OperationalStatus = registry ? "configured" : "not_created";
    let evidence = registry
      ? "Perfil registrado; no hay ejecución reciente que pruebe un worker activo."
      : "No existe un worker verificable registrado para este perfil.";

    if (key === "nova") {
      status = runtime.service_status.nova.status === "online"
        ? "online"
        : runtime.service_status.nova.status === "offline"
          ? "offline"
          : runtime.service_status.nova.status === "configured"
            ? "configured"
            : "unknown";
      evidence = runtime.service_status.nova.detail;
    } else if (latestRun && isFresh(lastActivityAt, AGI_RUNTIME_FRESH_MS)) {
      status = isFailedRun(latestRun.status) ? "degraded" : isSuccessfulRun(latestRun.status) ? "online" : "configured";
      evidence = `Ejecución reciente registrada con estado ${latestRun.status ?? "desconocido"}.`;
    } else if (latestRun) {
      status = "stale";
      evidence = `Existe evidencia histórica, pero la última ejecución no es reciente (${latestRun.status ?? "sin estado"}).`;
    }

    return {
      key: definition.key,
      title: definition.title,
      role: definition.subtitle,
      group: definition.group,
      status,
      registry_status: registry?.status ?? null,
      evidence,
      last_activity_at: lastActivityAt,
      last_run_status: latestRun?.status ?? null,
      worker_id: latestRun?.worker_id ?? null,
      checked_at: checkedAt,
    };
  });

  const chidoNode = nodes.find((node) => node.project_id === "chido-casino" || node.id === "chido-casino-web");
  const chidoLastSeen = chidoNode?.last_seen_at ?? null;
  const chidoStatus: OperationalStatus = isFresh(chidoLastSeen, NODE_FRESH_MS) ? "online" : chidoNode ? "stale" : "configured";

  const apps: OperationalApp[] = [
    {
      key: "hocker-one",
      title: "Hocker ONE",
      kind: "panel",
      status: "online",
      summary: "Panel privado de control y supervisión.",
      evidence: "La instancia actual respondió y generó este estado operativo.",
      href: "/owner",
      repository: "HockerAGI/hocker.one",
      last_activity_at: checkedAt,
      checked_at: checkedAt,
    },
    {
      key: "hocker-agi-web",
      title: "Hocker AGI Technologies",
      kind: "website",
      status: websiteHealth.online ? "online" : "offline",
      summary: "Sitio corporativo oficial y capa pública comercial.",
      evidence: websiteHealth.online ? "La URL pública respondió al health check HTTP." : "La URL pública no respondió al health check HTTP.",
      href: "https://hockeragi.vercel.app",
      repository: "HockerAGI/hocker.agi",
      last_activity_at: websiteHealth.online ? websiteHealth.checkedAt : null,
      checked_at: websiteHealth.checkedAt,
    },
    {
      key: "chido-casino",
      title: "Chido Casino",
      kind: "application",
      status: chidoStatus,
      summary: "Aplicación sensible con controles independientes.",
      evidence: chidoNode
        ? `Nodo registrado; última señal ${chidoLastSeen ?? "sin fecha"}.`
        : "Existe repositorio y esquema de datos, sin señal de nodo disponible.",
      href: "/chido",
      repository: "HockerAGI/chido.casino",
      last_activity_at: chidoLastSeen,
      checked_at: checkedAt,
    },
    {
      key: "hocker-supply",
      title: "Hocker Supply",
      kind: "module",
      status: "configured",
      summary: "Módulo interno parcial; no es una aplicación independiente verificada.",
      evidence: "Hay rutas y esquema de datos, pero no un runtime autónomo comprobado.",
      href: "/supply",
      repository: null,
      last_activity_at: null,
      checked_at: checkedAt,
    },
    ...NOT_CREATED_APPS.map(([key, title, summary]): OperationalApp => ({
      key,
      title,
      kind: "application",
      status: "not_created",
      summary,
      evidence: "Concepto documentado sin repositorio, despliegue ni health check operativo verificado.",
      href: null,
      repository: null,
      last_activity_at: null,
      checked_at: checkedAt,
    })),
  ];

  const freshNodes = nodes.filter((node) => isFresh(node.last_seen_at, NODE_FRESH_MS)).length;
  const verifiedServices = [runtime.service_status.nova, runtime.service_status.supabase]
    .filter((service) => service.status === "online").length + (websiteHealth.online ? 1 : 0);

  return {
    ok: databaseOk && runtime.ok,
    checked_at: checkedAt,
    source: databaseOk ? "supabase+health" : "partial",
    apps,
    agis,
    metrics: {
      verified_services: verifiedServices,
      configured_tools: runtime.counts.tools_configured,
      fresh_nodes: freshNodes,
      runs_24h: runs24h,
      pending_actions: pendingActions,
    },
    runtime,
  };
}
