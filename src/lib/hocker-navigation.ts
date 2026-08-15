import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  Brain,
  CheckSquare,
  CircleDot,
  Dices,
  FileCheck2,
  Grid2X2,
  Home,
  Landmark,
  LayoutDashboard,
  Map,
  Network,
  Package,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

export type HockerWorkspaceId = "nova" | "pulso" | "recursos";

export type HockerNavigationItem = {
  id: string;
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  keywords: string;
};

export type HockerNavigationSection = {
  id: HockerWorkspaceId;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  items: HockerNavigationItem[];
};

export type HockerSecondaryNavigationItem = HockerNavigationItem & {
  workspaceId: HockerWorkspaceId;
  group: string;
};

export const HOCKER_NAVIGATION: HockerNavigationSection[] = [
  {
    id: "nova",
    label: "NOVA",
    shortLabel: "NOVA",
    href: "/app/nova",
    icon: Bot,
    matchPrefixes: ["/chat", "/owner/nova", "/app/nova"],
    items: [
      {
        id: "nova",
        href: "/app/nova",
        label: "NOVA",
        shortLabel: "NOVA",
        icon: Bot,
        keywords: "nova chat conversación crear ejecutar archivos código imagen video",
      },
    ],
  },
  {
    id: "pulso",
    label: "Pulso",
    shortLabel: "Pulso",
    href: "/app/pulso",
    icon: Activity,
    matchPrefixes: [
      "/app/pulso",
      "/owner",
      "/owner/actions",
      "/owner/evidence",
      "/live",
      "/commands",
      "/workers",
      "/nodes",
      "/status",
      "/dashboard",
      "/security",
      "/governance",
    ],
    items: [
      {
        id: "pulso",
        href: "/app/pulso",
        label: "Pulso",
        shortLabel: "Pulso",
        icon: Activity,
        keywords: "pulso atención estado acciones cambios costo salud resumen",
      },
    ],
  },
  {
    id: "recursos",
    label: "Recursos",
    shortLabel: "Recursos",
    href: "/app/recursos",
    icon: Grid2X2,
    matchPrefixes: [
      "/app/recursos",
      "/catalog",
      "/map",
      "/apps",
      "/agis",
      "/integrations",
      "/memory",
      "/supply",
      "/chido",
      "/app/ecosistema",
    ],
    items: [
      {
        id: "recursos",
        href: "/app/recursos",
        label: "Recursos",
        shortLabel: "Recursos",
        icon: Grid2X2,
        keywords: "recursos capacidades skills habilidades conectores plugins mcp herramientas agis",
      },
    ],
  },
];

// Secondary destinations remain real and searchable, but no longer compete in persistent navigation.
export const HOCKER_SECONDARY_NAVIGATION: HockerSecondaryNavigationItem[] = [
  { id: "owner", workspaceId: "pulso", group: "Pulso", href: "/owner", label: "Resumen", icon: Home, keywords: "inicio owner resumen atención" },
  { id: "live", workspaceId: "pulso", group: "Pulso", href: "/live", label: "Señales", icon: Activity, keywords: "health heartbeat señal actividad monitoreo" },
  { id: "commands", workspaceId: "pulso", group: "Pulso", href: "/commands", label: "Tareas", icon: CheckSquare, keywords: "tareas commands cola aprobaciones owner gate" },
  { id: "workers", workspaceId: "pulso", group: "Pulso", href: "/workers", label: "Workers AGI", icon: Workflow, keywords: "workers trabajadores agi ejecuciones evidencia runtime" },
  { id: "nodes", workspaceId: "pulso", group: "Pulso", href: "/nodes", label: "Dispositivos", icon: Network, keywords: "nodes nodos heartbeat agentes sandbox local dispositivos" },
  { id: "status", workspaceId: "pulso", group: "Pulso", href: "/status", label: "Estado", icon: CircleDot, keywords: "status estado health disponibilidad evidencia" },
  { id: "dashboard", workspaceId: "pulso", group: "Pulso", href: "/dashboard", label: "Métricas", icon: LayoutDashboard, keywords: "dashboard señales métricas" },
  { id: "owner-actions", workspaceId: "pulso", group: "Pulso", href: "/owner/actions", label: "Aprobaciones", icon: CheckSquare, keywords: "owner acciones aprobar rechazar gate" },
  { id: "owner-evidence", workspaceId: "pulso", group: "Pulso", href: "/owner/evidence", label: "Actividad", icon: FileCheck2, keywords: "evidencia auditoria logs pruebas actividad" },
  { id: "security", workspaceId: "pulso", group: "Pulso", href: "/security", label: "Seguridad", icon: ShieldCheck, keywords: "seguridad security rls grants hardening" },
  { id: "governance", workspaceId: "pulso", group: "Pulso", href: "/governance", label: "Gobierno", icon: Landmark, keywords: "gobernanza reglas auditoria políticas" },
  { id: "catalog", workspaceId: "recursos", group: "Recursos", href: "/catalog", label: "Buscar", icon: Search, keywords: "buscar catalogo apps agis herramientas repositorios" },
  { id: "map", workspaceId: "recursos", group: "Recursos", href: "/map", label: "Mapa", icon: Map, keywords: "mapa arquitectura evidencia relaciones ecosistema" },
  { id: "apps", workspaceId: "recursos", group: "Recursos", href: "/apps", label: "Apps", icon: Grid2X2, keywords: "apps aplicaciones módulos inventario existencia" },
  { id: "agis", workspaceId: "recursos", group: "Recursos", href: "/agis", label: "AGIs", icon: Sparkles, keywords: "agis agentes perfiles workers evidencia" },
  { id: "integrations", workspaceId: "recursos", group: "Recursos", href: "/integrations", label: "Conexiones", icon: Plug, keywords: "integraciones mcp conectores apis herramientas" },
  { id: "memory", workspaceId: "recursos", group: "Recursos", href: "/memory", label: "Memoria", icon: Brain, keywords: "memoria registros aprendizaje contexto evidencia syntia" },
  { id: "supply", workspaceId: "recursos", group: "Recursos", href: "/supply", label: "Supply", icon: Package, keywords: "supply inventario pedidos productos" },
  { id: "chido", workspaceId: "recursos", group: "Recursos", href: "/chido", label: "Chido", icon: Dices, keywords: "chido casino juegos wallet operación" },
  { id: "settings", workspaceId: "pulso", group: "Cuenta", href: "/app/ajustes", label: "Ajustes", icon: Settings, keywords: "ajustes cuenta seguridad configuración" },
];

const DEFAULT_HOCKER_SECTION = HOCKER_NAVIGATION[0]!;

export function isHockerRouteActive(pathname: string, href: string): boolean {
  if (href === "/owner") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveHockerSection(pathname: string): HockerNavigationSection {
  const explicit = HOCKER_NAVIGATION.find((section) =>
    section.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
  if (explicit) return explicit;

  const primary = HOCKER_NAVIGATION.find((section) => isHockerRouteActive(pathname, section.href));
  if (primary) return primary;

  const secondary = [...HOCKER_SECONDARY_NAVIGATION]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isHockerRouteActive(pathname, item.href));

  return HOCKER_NAVIGATION.find((section) => section.id === secondary?.workspaceId)
    ?? DEFAULT_HOCKER_SECTION;
}

export function getActiveHockerItem(pathname: string): HockerNavigationItem | undefined {
  return [
    ...HOCKER_NAVIGATION.flatMap((section) => section.items),
    ...HOCKER_SECONDARY_NAVIGATION,
  ]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isHockerRouteActive(pathname, item.href));
}

export function getHockerRouteTitle(pathname: string): string {
  const item = getActiveHockerItem(pathname);
  if (item) return item.label;

  const section = getActiveHockerSection(pathname);
  const belongsToSection = section.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (belongsToSection) return section.label;

  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return "Hocker ONE";

  return segment
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
