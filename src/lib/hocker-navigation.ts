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
  MoreHorizontal,
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
  id: "inicio" | "nova" | "trabajo" | "ecosistema" | "operacion" | "mas";
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  items: HockerNavigationItem[];
};

export const HOCKER_NAVIGATION: HockerNavigationSection[] = [
  {
    id: "inicio", label: "Inicio", shortLabel: "Inicio", href: "/owner", icon: Home,
    items: [
      { id: "owner", href: "/owner", label: "Resumen", icon: Home, keywords: "inicio owner resumen" },
      { id: "catalog", href: "/catalog", label: "Buscar", icon: Search, keywords: "buscar catalogo ecosistema" },
      { id: "map", href: "/map", label: "Mapa", icon: Map, keywords: "mapa relaciones arquitectura" },
      { id: "dashboard", href: "/dashboard", label: "Panel", icon: LayoutDashboard, keywords: "panel dashboard señales" },
    ],
  },
  {
    id: "nova", label: "NOVA", shortLabel: "NOVA", href: "/chat", icon: Bot,
    matchPrefixes: ["/owner/nova", "/app/nova"],
    items: [{ id: "chat", href: "/chat", label: "Chat", icon: Bot, keywords: "nova chat conversación" }],
  },
  {
    id: "trabajo", label: "Trabajo", shortLabel: "Trabajo", href: "/commands", icon: CheckSquare,
    matchPrefixes: ["/owner/actions"],
    items: [
      { id: "commands", href: "/commands", label: "Tareas", icon: CheckSquare, keywords: "tareas comandos cola" },
      { id: "owner-actions", href: "/owner/actions", label: "Aprobaciones", icon: CheckSquare, keywords: "owner aprobar rechazar" },
    ],
  },
  {
    id: "ecosistema", label: "Ecosistema", shortLabel: "Ecosistema", href: "/apps", icon: Grid2X2,
    matchPrefixes: ["/owner/apps", "/owner/agis"],
    items: [
      { id: "apps", href: "/apps", label: "Apps", icon: Grid2X2, keywords: "apps aplicaciones módulos" },
      { id: "agis", href: "/agis", label: "AGIs", icon: Sparkles, keywords: "agis agentes inteligencia" },
      { id: "integrations", href: "/integrations", label: "Conexiones", icon: Plug, keywords: "conexiones integraciones api herramientas" },
      { id: "memory", href: "/memory", label: "Memoria", icon: Brain, keywords: "memoria contexto aprendizaje" },
      { id: "supply", href: "/supply", label: "Supply", icon: Package, keywords: "supply inventario pedidos" },
      { id: "chido", href: "/chido", label: "Chido", icon: Dices, keywords: "chido casino juegos" },
    ],
  },
  {
    id: "operacion", label: "Operación", shortLabel: "Operación", href: "/live", icon: Activity,
    items: [
      { id: "live", href: "/live", label: "Señales", icon: Activity, keywords: "señales actividad monitoreo" },
      { id: "workers", href: "/workers", label: "Procesos", icon: Workflow, keywords: "workers procesos agi ejecuciones" },
      { id: "nodes", href: "/nodes", label: "Nodos", icon: Network, keywords: "nodos heartbeat" },
      { id: "status", href: "/status", label: "Estado", icon: CircleDot, keywords: "estado salud disponibilidad" },
    ],
  },
  {
    id: "mas", label: "Más", shortLabel: "Más", href: "/security", icon: MoreHorizontal,
    matchPrefixes: ["/owner/evidence", "/admin/jurix"],
    items: [
      { id: "security", href: "/security", label: "Seguridad", icon: ShieldCheck, keywords: "seguridad rls permisos" },
      { id: "governance", href: "/governance", label: "Reglas", icon: Landmark, keywords: "reglas gobierno políticas" },
      { id: "owner-evidence", href: "/owner/evidence", label: "Evidencia", icon: FileCheck2, keywords: "evidencia auditoria registros" },
      { id: "jurix", href: "/admin/jurix", label: "Legal", icon: FileCheck2, keywords: "jurix legal cumplimiento" },
    ],
  },
];

export const HOCKER_SECONDARY_NAVIGATION: HockerNavigationItem[] = HOCKER_NAVIGATION.flatMap((section) => section.items);

export const HOCKER_MOBILE_NAVIGATION: HockerNavigationItem[] = [
  { id: "inicio", href: "/owner", label: "Inicio", shortLabel: "Inicio", icon: Home, keywords: "inicio" },
  { id: "nova", href: "/chat", label: "NOVA", shortLabel: "NOVA", icon: Bot, keywords: "nova chat" },
  { id: "trabajo", href: "/commands", label: "Trabajo", shortLabel: "Trabajo", icon: CheckSquare, keywords: "tareas aprobaciones" },
  { id: "ecosistema", href: "/apps", label: "Ecosistema", shortLabel: "Ecosistema", icon: Grid2X2, keywords: "apps agis" },
  { id: "mas", href: "/security", label: "Más", shortLabel: "Más", icon: MoreHorizontal, keywords: "operacion seguridad reglas evidencia" },
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
    ?? HOCKER_NAVIGATION.find((section) => isHockerRouteActive(pathname, section.href))
    ?? DEFAULT_HOCKER_SECTION;
}

export function getActiveHockerItem(pathname: string): HockerNavigationItem | undefined {
  return HOCKER_SECONDARY_NAVIGATION
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isHockerRouteActive(pathname, item.href));
}

export function getHockerRouteTitle(pathname: string): string {
  const item = getActiveHockerItem(pathname);
  if (item) return item.label;
  const section = getActiveHockerSection(pathname);
  if (section) return section.label;
  return "Hocker ONE";
}
