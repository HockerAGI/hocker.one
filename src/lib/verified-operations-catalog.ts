import {
  OPERATIONS_CATALOG,
  type OperationsCatalogItem,
  type OperationsCatalogStatus,
} from "@/lib/operations-catalog";
import type {
  OperationalAgi,
  OperationalApp,
  OperationalSnapshot,
  OperationalStatus,
} from "@/lib/hocker-operational-state";

function catalogStatus(status: OperationalStatus): OperationsCatalogStatus {
  if (status === "online") return "operational";
  if (["configured", "stale", "degraded", "protected"].includes(status)) return "limited";
  if (status === "not_created" || status === "planned") return "planned";
  return "development";
}

function appKeyFromItem(item: OperationsCatalogItem): string | null {
  if (item.id.startsWith("product-")) return item.id.slice("product-".length);
  if (["hocker-one", "chido-casino", "hocker-agi-web"].includes(item.id)) return item.id;
  return null;
}

function agiKeyFromItem(item: OperationsCatalogItem): string | null {
  if (!item.id.startsWith("agent-")) return null;
  return item.id.slice("agent-".length);
}

function formatEvidence(status: OperationalStatus, evidence: string, lastActivity: string | null): string {
  const prefix = status === "online"
    ? "Evidencia actual"
    : status === "not_created"
      ? "Sin producto operativo"
      : status === "stale"
        ? "Evidencia histórica"
        : "Estado limitado";
  const activity = lastActivity ? ` Última actividad: ${lastActivity}.` : "";
  return `${prefix}: ${evidence}${activity}`;
}

function resolveApp(item: OperationsCatalogItem, apps: Map<string, OperationalApp>): OperationsCatalogItem | null {
  const key = appKeyFromItem(item);
  if (!key) return null;
  const app = apps.get(key);
  if (!app) return { ...item, status: "planned", internalTruth: "No existe evidencia operativa para este concepto." };

  return {
    ...item,
    status: catalogStatus(app.status),
    internalTruth: formatEvidence(app.status, app.evidence, app.last_activity_at),
    ...(app.repository ? { repository: app.repository } : {}),
  };
}

function resolveAgi(item: OperationsCatalogItem, agis: Map<string, OperationalAgi>): OperationsCatalogItem | null {
  const key = agiKeyFromItem(item);
  if (!key) return null;
  const agi = agis.get(key);
  if (!agi) return { ...item, status: "planned", internalTruth: "Perfil documentado sin worker ni ejecución verificable." };

  return {
    ...item,
    status: catalogStatus(agi.status),
    internalTruth: formatEvidence(agi.status, agi.evidence, agi.last_activity_at),
  };
}

function resolveCoreArea(item: OperationsCatalogItem, snapshot: OperationalSnapshot): OperationsCatalogItem {
  if (item.id === "nova-agi") {
    const nova = snapshot.runtime.service_status.nova;
    return {
      ...item,
      status: nova.status === "online" ? "operational" : nova.status === "configured" ? "limited" : "development",
      internalTruth: `${nova.detail} Última verificación: ${nova.last_verified_at ?? "sin verificación exitosa"}.`,
    };
  }

  if (item.id === "hocker-node-agent") {
    return {
      ...item,
      status: snapshot.metrics.fresh_nodes > 0 ? "operational" : "limited",
      internalTruth: snapshot.metrics.fresh_nodes > 0
        ? `${snapshot.metrics.fresh_nodes} nodo(s) reportaron señal durante los últimos cinco minutos.`
        : "No hay nodos con heartbeat dentro de los últimos cinco minutos.",
    };
  }

  if (item.id === "verifiable-agi-workers") {
    return {
      ...item,
      status: snapshot.runtime.schema_ready && snapshot.metrics.runs_24h > 0 ? "operational" : "limited",
      internalTruth: snapshot.runtime.schema_ready
        ? `${snapshot.metrics.runs_24h} ejecución(es) registradas durante las últimas 24 horas.`
        : "El esquema de workers no pudo verificarse completamente.",
    };
  }

  if (item.id === "tools-and-apis") {
    const verified = snapshot.runtime.counts.tools_connected;
    const configured = snapshot.runtime.counts.tools_configured;
    return {
      ...item,
      status: verified > 0 ? "operational" : configured > 0 ? "limited" : "development",
      internalTruth: `${verified} conexión(es) verificadas y ${configured} herramienta(s) configuradas. Configuración no equivale a conectividad.`,
    };
  }

  if (item.id === "work-and-approvals") {
    return {
      ...item,
      status: snapshot.runtime.schema_ready ? "operational" : "limited",
      internalTruth: snapshot.runtime.schema_ready
        ? `${snapshot.metrics.pending_actions} acción(es) pendientes de revisión o ejecución.`
        : "La lectura del esquema de acciones no quedó completamente verificada.",
    };
  }

  return item;
}

export function buildVerifiedOperationsCatalog(snapshot: OperationalSnapshot): OperationsCatalogItem[] {
  const apps = new Map(snapshot.apps.map((app) => [app.key, app]));
  const agis = new Map(snapshot.agis.map((agi) => [agi.key, agi]));

  return OPERATIONS_CATALOG.map((item) => {
    const resolvedApp = resolveApp(item, apps);
    if (resolvedApp) return resolvedApp;

    const resolvedAgi = resolveAgi(item, agis);
    if (resolvedAgi) return resolvedAgi;

    return resolveCoreArea(item, snapshot);
  });
}
