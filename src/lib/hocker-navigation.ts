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
  LayoutDashboard,
  Landmark,
  Map,
  Network,
  Package,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

export type HockerNavigationItem = {
  id: string;
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  keywords: string;
};

export type HockerNavigationSection = {
  id: "inicio" | "operacion" | "nova" | "ecosistema" | "control";
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  items: HockerNavigationItem[];
};

export const HOCKER_NAVIGATION: HockerNavigationSection[] = [
  {
    id: "inicio",
    label: "Inicio",
    shortLabel: "Inicio",
    href: "/owner",
    icon: Home,
    items: [
      { id: "owner", href: "/owner", label: "Resumen ejecutivo", shortLabel: "Resumen", icon: Home, keywords: "inicio home owner resumen panel" },
      { id: "catalog", href: "/catalog", label: "Buscar en el ecosistema", shortLabel: "Buscar", icon: Search, keywords: "buscar catalogo apps agis herramientas repositorios" },
      { id: "map", href: "/map", label: "Mapa operativo", shortLabel: "Mapa", icon: Map, keywords: "mapa arquitectura evidencia relaciones ecosistema" },
      { id: "dashboard", href: "/dashboard", label: "Dashboard técnico", shortLabel: "Dashboard", icon: LayoutDashboard, keywords: "dashboard tecnico señales métricas" },
    ],
  },
  {
    id: "operacion",
    label: "Operación",
    shortLabel: "Operación",
    href: "/live",
    icon: Activity,
    items: [
      { id: "live", href: "/live", label: "Señales operativas", shortLabel: "Señales", icon: Activity, keywords: "health heartbeat señal actividad monitoreo" },
      { id: "commands", href: "/commands", label: "Tareas y aprobaciones", shortLabel: "Tareas", icon: CheckSquare, keywords: "tareas commands cola aprobaciones owner gate" },
      { id: "workers", href: "/workers", label: "Workers AGI", shortLabel: "Workers", icon: Workflow, keywords: "workers trabajadores agi ejecuciones evidencia" },
      { id: "nodes", href: "/nodes", label: "Nodos y heartbeat", shortLabel: "Nodos", icon: Network, keywords: "nodes nodos heartbeat agentes sandbox local" },
      { id: "status", href: "/status", label: "Estado verificable", shortLabel: "Estado", icon: CircleDot, keywords: "status estado health disponibilidad evidencia" },
    ],
  },
  {
    id: "nova",
    label: "NOVA",
    shortLabel: "NOVA",
    href: "/chat",
    icon: Bot,
    matchPrefixes: ["/owner/nova", "/app/nova"],
    items: [
      { id: "chat", href: "/chat", label: "NOVA Chat", shortLabel: "Chat", icon: Bot, keywords: "nova chat conversación estado runtime ejecutar aprobar" },
    ],
  },
  {
    id: "ecosistema",
    label: "Ecosistema",
    shortLabel: "Ecosistema",
    href: "/apps",
    icon: Grid2X2,
    matchPrefixes: ["/owner/apps", "/owner/agis"],
    items: [
      { id: "apps", href: "/apps", label: "Aplicaciones y módulos", shortLabel: "Apps", icon: Grid2X2, keywords: "apps aplicaciones módulos inventario existencia" },
      { id: "agis", href: "/agis", label: "Perfiles y workers AGI", shortLabel: "AGIs", icon: Sparkles, keywords: "agis agentes perfiles workers evidencia" },
      { id: "integrations", href: "/integrations", label: "Herramientas y APIs", shortLabel: "Integraciones", icon: Plug, keywords: "integraciones mcp conectores apis herramientas" },
      { id: "memory", href: "/memory", label: "Registros de memoria", shortLabel: "Memoria", icon: Brain, keywords: "memoria registros aprendizaje contexto evidencia" },
      { id: "supply", href: "/supply", label: "Hocker Supply", shortLabel: "Supply", icon: Package, keywords: "supply inventario pedidos productos" },
      { id: "chido", href: "/chido", label: "Chido Casino", shortLabel: "Chido", icon: Dices, keywords: "chido casino juegos wallet operación" },
    ],
  },
  {
    id: "control",
    label: "Control",
    shortLabel: "Control",
    href: "/security",
    icon: ShieldCheck,
    matchPrefixes: ["/owner/actions", "/owner/evidence", "/admin/jurix"],
    items: [
      { id: "security", href: "/security", label: "Seguridad", icon: ShieldCheck, keywords: "seguridad security rls grants hardening" },
      { id: "governance", href: "/governance", label: "Reglas y gobierno", shortLabel: "Gobierno", icon: Landmark, keywords: "gobernanza reglas auditoria políticas" },
      { id: "owner-actions", href: "/owner/actions", label: "Aprobaciones Owner", shortLabel: "Aprobaciones", icon: CheckSquare, keywords: "owner acciones aprobar rechazar gate" },
      { id: "owner-evidence", href: "/owner/evidence", label: "Evidencia y auditoría", shortLabel: "Evidencia", icon: FileCheck2, keywords: "evidencia auditoria logs pruebas" },
    ],
  },
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

  const candidates = HOCKER_NAVIGATION.flatMap((section) =>
    section.items.map((item) => ({ section, item })),
  ).sort((a, b) => b.item.href.length - a.item.href.length);

  return candidates.find(({ item }) => isHockerRouteActive(pathname, item.href))?.section
    ?? DEFAULT_HOCKER_SECTION;
}

export function getActiveHockerItem(pathname: string): HockerNavigationItem | undefined {
  return HOCKER_NAVIGATION
    .flatMap((section) => section.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isHockerRouteActive(pathname, item.href));
}

export function getHockerRouteTitle(pathname: string): string {
  const item = getActiveHockerItem(pathname);
  if (item) return item.label;

  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return "Hocker ONE";

  return segment
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
