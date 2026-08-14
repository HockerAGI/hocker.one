import { PUBLIC_AGIS, PUBLIC_APPS } from "@/lib/public-catalog";

export type OperationsCatalogKind = "app" | "service" | "agent" | "area";
export type OperationsCatalogStatus = "operational" | "limited" | "development" | "planned";

export type OperationsCatalogItem = {
  id: string;
  label: string;
  kind: OperationsCatalogKind;
  status: OperationsCatalogStatus;
  summary: string;
  href: string;
  keywords: string[];
  ownerAgis: string[];
  capabilities: string[];
  repository?: string;
  runtime?: string;
  approval: "none" | "read_only" | "owner_gate" | "manual";
  internalTruth: string;
};

export const OPERATIONS_STATUS_LABELS: Record<OperationsCatalogStatus, string> = {
  operational: "Operativo",
  limited: "Operativo con límites",
  development: "En desarrollo",
  planned: "Planificado",
};

const CORE_ITEMS: OperationsCatalogItem[] = [
  {
    id: "hocker-one",
    label: "Hocker ONE",
    kind: "app",
    status: "operational",
    summary: "Centro privado de mando, aprobaciones, evidencia, memoria, nodos y operación.",
    href: "/owner",
    keywords: ["panel", "control", "owner", "dashboard", "aprobaciones"],
    ownerAgis: ["NOVA", "Syntia", "Vertx"],
    capabilities: ["Owner Gate", "NOVA Chat", "Mapa", "Auditoría", "MCP"],
    repository: "HockerAGI/hocker.one",
    runtime: "Next.js · Vercel",
    approval: "owner_gate",
    internalTruth: "Aplicación privada principal del ecosistema.",
  },
  {
    id: "nova-agi",
    label: "NOVA Runtime",
    kind: "service",
    status: "operational",
    summary: "Orquestador de conversación, proveedores, memoria, herramientas MCP y borradores de acción.",
    href: "/chat",
    keywords: ["nova", "orquestador", "llm", "ollama", "proveedores", "mcp"],
    ownerAgis: ["NOVA", "Syntia", "Vertx"],
    capabilities: ["Provider fallback", "MCP read", "Action drafts", "Memoria"],
    repository: "HockerAGI/nova.agi",
    runtime: "Fastify · Node 22 · local/Railway",
    approval: "owner_gate",
    internalTruth: "Servicio agentic verificable; no se presenta como conciencia o AGI demostrada.",
  },
  {
    id: "hocker-node-agent",
    label: "Hocker Node Agent",
    kind: "service",
    status: "limited",
    summary: "Brazo de ejecución física dentro de un sandbox local autorizado.",
    href: "/nodes",
    keywords: ["nodo", "agente", "local", "sandbox", "ejecucion"],
    ownerAgis: ["Hostia", "Vertx", "NOVA"],
    capabilities: ["Shell permitido", "Archivos permitidos", "Health", "Firma"],
    repository: "HockerAGI/hocker-node-agent",
    runtime: "Node 22 · equipo local",
    approval: "owner_gate",
    internalTruth: "Solo está disponible cuando un nodo físico autorizado está conectado.",
  },
  {
    id: "verifiable-agi-workers",
    label: "Trabajadores AGI verificables",
    kind: "area",
    status: "limited",
    summary: "Cola especializada con idempotencia, locks, reintentos, evidencia, hash y respuesta correlacionada a NOVA.",
    href: "/workers",
    keywords: ["workers", "trabajadores", "agi", "ia a ia", "tareas", "runs", "evidencia", "hash"],
    ownerAgis: ["NOVA", "Syntia", "Vertx"],
    capabilities: ["Asignar", "Procesar una tarea", "Recuperar locks", "Ver evidencia"],
    repository: "HockerAGI/nova.agi · HockerAGI/hocker.one",
    runtime: "NOVA Runtime · Supabase · Hocker ONE",
    approval: "owner_gate",
    internalTruth: "El código está fusionado; la ejecución depende de migración aplicada, despliegue activo y loop habilitado o ejecución manual Owner.",
  },
  {
    id: "chido-casino",
    label: "Chido Casino",
    kind: "app",
    status: "operational",
    summary: "PWA transaccional con cartera atómica, operación protegida y juego responsable +18.",
    href: "/chido",
    keywords: ["chido", "casino", "wallet", "pagos", "juegos", "operacion"],
    ownerAgis: ["Chido Gerente", "Chido Wins", "Numia", "Jurix", "Vertx"],
    capabilities: ["Monitoreo", "Wallet", "Preflight", "Auditoría"],
    repository: "HockerAGI/chido.casino",
    runtime: "Next.js · Vercel · Supabase",
    approval: "owner_gate",
    internalTruth: "Producto operativo; cualquier acción financiera permanece bajo controles transaccionales.",
  },
  {
    id: "chido-lab",
    label: "CHIDO Lab",
    kind: "service",
    status: "development",
    summary: "Laboratorio aislado para investigación, simulación, contratos de juego y evidencia previa a release.",
    href: "/chido",
    keywords: ["chido", "lab", "simulacion", "math", "fairness", "api", "investigacion"],
    ownerAgis: ["NOVA", "Chido Gerente", "Chido Wins", "Curvewind", "Vertx"],
    capabilities: ["Simulación", "Contratos", "Conformance", "Evidencia"],
    repository: "HockerAGI/chido.lab",
    runtime: "GitHub · Node/TypeScript · sin runtime productivo autorizado",
    approval: "owner_gate",
    internalTruth: "Fuente de laboratorio y evidencia; no es RGS público, deployment productivo ni autorización de dinero real.",
  },
  {
    id: "chido-games",
    label: "CHIDO Games",
    kind: "service",
    status: "development",
    summary: "Repositorio B2B/RGS en construcción para releases inmutables y migración de la CHIDO API Foundation.",
    href: "/chido",
    keywords: ["chido", "games", "b2b", "rgs", "release bundle", "api", "conformance"],
    ownerAgis: ["NOVA", "Chido Gerente", "Chido Wins", "Hostia", "Vertx"],
    capabilities: ["Release Bundle", "Registry", "API Foundation en migración", "Conformance pendiente"],
    repository: "HockerAGI/chido.games",
    runtime: "GitHub · Node/TypeScript · sin deployment productivo autorizado",
    approval: "owner_gate",
    internalTruth: "R0-R2 y plan R3 están versionados; la implementación R3 sigue parcial y no autoriza partners, producción ni dinero real.",
  },
  {
    id: "hocker-agi-web",
    label: "Hocker AGI Web",
    kind: "app",
    status: "operational",
    summary: "Sitio público corporativo, comercial, informativo y legal de Hocker AGI Technologies.",
    href: "https://hockeragi.vercel.app",
    keywords: ["sitio", "web", "publico", "marketing", "seo", "empresa"],
    ownerAgis: ["NOVA", "Nova Ads", "Candy Ads", "Jurix"],
    capabilities: ["Sitio público", "SEO", "Servicios", "Contacto"],
    repository: "HockerAGI/hocker.agi",
    runtime: "Next.js · Vercel",
    approval: "manual",
    internalTruth: "No ejecuta comandos ni contiene credenciales administrativas.",
  },
  {
    id: "tools-and-apis",
    label: "Herramientas y APIs",
    kind: "area",
    status: "operational",
    summary: "Registro vivo de integraciones, estado, permisos, capacidades y evidencia reciente.",
    href: "/integrations",
    keywords: ["herramientas", "api", "mcp", "integraciones", "conectores"],
    ownerAgis: ["Hostia", "Vertx", "NOVA"],
    capabilities: ["Health", "Read-only", "Owner Gate", "Eventos"],
    approval: "owner_gate",
    internalTruth: "La disponibilidad real se calcula desde el registro y sus health checks.",
  },
  {
    id: "work-and-approvals",
    label: "Tareas y aprobaciones",
    kind: "area",
    status: "operational",
    summary: "Cola segura de acciones, decisiones Owner, locks, resultados y recuperación.",
    href: "/commands",
    keywords: ["tareas", "acciones", "aprobaciones", "cola", "evidencia"],
    ownerAgis: ["NOVA", "Vertx"],
    capabilities: ["Aprobar", "Rechazar", "Ejecutar", "Evidencia"],
    approval: "owner_gate",
    internalTruth: "Las escrituras compatibles solo se ejecutan después de aprobación explícita.",
  },
];

const APP_STATUS: Record<string, OperationsCatalogStatus> = {
  "hocker-one": "operational",
  "chido-casino": "operational",
  "hocker-supply": "development",
  "hocker-ads": "development",
  "hocker-hub": "development",
  "hocker-wallet": "planned",
  "hocker-drive-cloud": "development",
  trackhok: "planned",
  "nexpa-app": "planned",
  "hocker-up": "development",
};

const APP_REPOSITORY: Record<string, string> = {
  "hocker-one": "HockerAGI/hocker.one",
  "chido-casino": "HockerAGI/chido.casino",
  "hocker-ads": "HockerAGI/hocker.ads",
};

const APP_OPERATIONS_OVERRIDES: Record<
  string,
  Pick<OperationsCatalogItem, "summary" | "ownerAgis" | "capabilities" | "internalTruth">
> = {
  "hocker-ads": {
    summary: "Marketing, ventas y tecnología para hacer crecer tu negocio, con servicios y especialistas IA bajo control de Hocker ONE.",
    ownerAgis: ["NOVA", "Nova Ads", "Candy Ads", "PRO IA", "REVIA"],
    capabilities: ["Servicios Express", "Especialistas IA", "Equipo Completo", "Publicidad y Marketing", "Ventas y Atención", "Sitios, Apps y Tecnología", "Proyectos a Medida", "Empresas"],
    internalTruth: "Producto definido y repositorio privado creado; runtime, tenant, deploy, pagos y conectores productivos todavía no están verificados.",
  },
};

const PRODUCT_ITEMS: OperationsCatalogItem[] = PUBLIC_APPS
  .filter((app) => !["hocker-one", "chido-casino"].includes(app.slug))
  .map((app) => {
    const override = APP_OPERATIONS_OVERRIDES[app.slug];

    return {
      id: `product-${app.slug}`,
      label: app.title,
      kind: "app" as const,
      status: APP_STATUS[app.slug] ?? "planned",
      summary: override?.summary ?? app.summary,
      href: `/apps/${app.slug}`,
      keywords: [app.slug, app.title, app.tagline, app.audience, ...app.benefits, ...(override?.capabilities ?? [])],
      ownerAgis: override?.ownerAgis ?? app.integration.split("+").map((item) => item.trim()),
      capabilities: override?.capabilities ?? app.benefits,
      ...(APP_REPOSITORY[app.slug] ? { repository: APP_REPOSITORY[app.slug] } : {}),
      approval: "manual" as const,
      internalTruth:
        override?.internalTruth ??
        ((APP_STATUS[app.slug] ?? "planned") === "planned"
          ? "Concepto documentado sin aplicación operativa verificada en este repositorio."
          : "Módulo parcial o producto todavía en integración."),
    };
  });

const AGENT_STATUS: Record<string, OperationsCatalogStatus> = {
  nova: "operational",
  syntia: "limited",
  vertx: "limited",
  hostia: "limited",
};

const AGENT_ITEMS: OperationsCatalogItem[] = PUBLIC_AGIS.map((agi) => {
  const status = AGENT_STATUS[agi.slug] ?? "development";

  return {
    id: `agent-${agi.slug}`,
    label: agi.title,
    kind: "agent",
    status,
    summary: `${agi.role}. ${agi.summary}`,
    href: `/agis/${agi.slug}`,
    keywords: [agi.slug, agi.title, agi.role, agi.cluster, ...agi.partnerApps],
    ownerAgis: agi.slug === "nova" ? ["NOVA"] : ["NOVA", agi.title],
    capabilities: [agi.impact, ...agi.partnerApps],
    approval: agi.slug === "nova" ? "owner_gate" : "manual",
    internalTruth:
      status === "operational"
        ? "Orquestador activo con acciones sujetas a controles y evidencia."
        : status === "limited"
          ? "Función implementada parcialmente dentro de servicios compartidos; no es todavía un trabajador independiente completo."
          : "Perfil especializado documentado; trabajador independiente verificable todavía en desarrollo.",
  };
});

export const OPERATIONS_CATALOG: OperationsCatalogItem[] = [
  ...CORE_ITEMS,
  ...PRODUCT_ITEMS,
  ...AGENT_ITEMS,
];

export function operationsCatalogCounts() {
  return OPERATIONS_CATALOG.reduce(
    (counts, item) => {
      counts.total += 1;
      counts[item.status] += 1;
      return counts;
    },
    { total: 0, operational: 0, limited: 0, development: 0, planned: 0 },
  );
}
