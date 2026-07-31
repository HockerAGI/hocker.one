"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AppWindow,
  Bot,
  Brain,
  CheckSquare,
  CircleDot,
  Dices,
  Grid2X2,
  Home,
  Landmark,
  Map as MapIcon,
  Network,
  Package,
  Plug,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Database,
  Boxes,
} from "lucide-react";
import { OPERATIONS_CATALOG, type OperationsCatalogKind } from "@/lib/operations-catalog";

type IconType = typeof Home;

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  group: string;
  keywords?: string;
};

const BASE_ITEMS: PaletteItem[] = [
  { id: "owner", label: "Inicio", href: "/owner", icon: Home, group: "Núcleo", keywords: "home dashboard inicio panel" },
  { id: "catalog", label: "Buscar en el ecosistema", href: "/catalog", icon: Search, group: "Núcleo", keywords: "catalogo buscador apps agis herramientas repositorios" },
  { id: "map", label: "Mapa", href: "/map", icon: MapIcon, group: "Núcleo", keywords: "map mapa overview" },
  { id: "live", label: "Sistema en vivo", href: "/live", icon: Activity, group: "Núcleo", keywords: "live vivo realtime monitoreo" },
  { id: "chat", label: "NOVA Chat", href: "/chat", icon: Bot, group: "Núcleo", keywords: "nova chat ai agente conversacion aprobar ejecutar" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: CircleDot, group: "Núcleo", keywords: "dashboard sistema panel" },
  { id: "commands", label: "Tareas y aprobaciones", href: "/commands", icon: CheckSquare, group: "Operación", keywords: "commands tareas queue cola owner gate evidencia" },
  { id: "nodes", label: "Nodos y agentes", href: "/nodes", icon: Network, group: "Operación", keywords: "nodes nodos agent agente local sandbox" },
  { id: "status", label: "Salud del sistema", href: "/status", icon: Activity, group: "Operación", keywords: "status estado health salud" },
  { id: "apps", label: "Apps", href: "/apps", icon: Grid2X2, group: "Ecosistema", keywords: "apps aplicaciones productos" },
  { id: "agis", label: "AGIs y funciones", href: "/agis", icon: Sparkles, group: "Ecosistema", keywords: "agis agentes funciones especialistas" },
  { id: "integrations", label: "Herramientas y APIs", href: "/integrations", icon: Plug, group: "Ecosistema", keywords: "integrations integraciones mcp conectores api herramientas" },
  { id: "memory", label: "Memoria y aprendizaje", href: "/memory", icon: Brain, group: "Ecosistema", keywords: "memory memoria aprendizaje evidencia" },
  { id: "supply", label: "Supply", href: "/supply", icon: Package, group: "Ecosistema", keywords: "supply suministros inventario pedidos" },
  { id: "chido", label: "Chido Casino", href: "/chido", icon: Dices, group: "Ecosistema", keywords: "chido casino juegos wallet operacion" },
  { id: "chido-dashboard", label: "Chido Dashboard", href: "/chido/dashboard", icon: Activity, group: "Ecosistema", keywords: "chido dashboard casino monitoreo" },
  { id: "chido-admin", label: "Chido Admin", href: "/chido/admin", icon: ShieldCheck, group: "Ecosistema", keywords: "chido admin kyc depositos retiros pausa" },
  { id: "chido-ops", label: "Chido Ops", href: "/chido/ops", icon: Database, group: "Ecosistema", keywords: "chido ops operaciones monitoring" },
  { id: "security", label: "Seguridad", href: "/security", icon: ShieldCheck, group: "Gobernanza", keywords: "security seguridad rls permisos" },
  { id: "governance", label: "Reglas y gobierno", href: "/governance", icon: Landmark, group: "Gobernanza", keywords: "governance gobierno auditoria reglas" },
];

function catalogIcon(kind: OperationsCatalogKind): IconType {
  if (kind === "app") return AppWindow;
  if (kind === "service") return ServerCog;
  if (kind === "agent") return Bot;
  return Boxes;
}

function catalogGroup(kind: OperationsCatalogKind): string {
  if (kind === "app") return "Productos";
  if (kind === "service") return "Servicios internos";
  if (kind === "agent") return "AGIs";
  return "Áreas";
}

const CATALOG_ITEMS: PaletteItem[] = OPERATIONS_CATALOG
  .filter((item) => item.href.startsWith("/"))
  .map((item) => ({
    id: `catalog-${item.id}`,
    label: item.label,
    href: item.href,
    icon: catalogIcon(item.kind),
    group: catalogGroup(item.kind),
    keywords: [
      item.status,
      item.repository ?? "",
      item.runtime ?? "",
      item.internalTruth,
      ...item.keywords,
      ...item.ownerAgis,
      ...item.capabilities,
    ].join(" "),
  }));

const PALETTE_ITEMS = [...BASE_ITEMS, ...CATALOG_ITEMS].filter(
  (item, index, all) => all.findIndex((candidate) => candidate.href === item.href && candidate.label === item.label) === index,
);

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape" && open) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-MX");
    if (!normalized) return PALETTE_ITEMS;

    return PALETTE_ITEMS.filter((item) =>
      `${item.label} ${item.group} ${item.keywords ?? ""}`
        .toLocaleLowerCase("es-MX")
        .includes(normalized),
    );
  }, [query]);

  useEffect(() => setActiveIndex(0), [filtered]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const navigate = useCallback((item: PaletteItem) => {
    setOpen(false);
    router.push(item.href);
  }, [router]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) navigate(item);
    }
  }

  if (!open) return null;

  const grouped = new globalThis.Map<string, PaletteItem[]>();
  for (const item of filtered) {
    grouped.set(item.group, [...(grouped.get(item.group) ?? []), item]);
  }

  let runningIndex = 0;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />

      <div className="fixed left-1/2 top-[10%] z-[201] w-[92vw] max-w-[680px] -translate-x-1/2">
        <div className="overflow-hidden rounded-[24px] border border-white/15 bg-[#070d1a] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
            <Search size={20} className="shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar app, AGI, herramienta, repositorio o función…"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-slate-500 focus:outline-none"
              aria-label="Buscar en Hocker ONE"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">ESC</kbd>
          </div>

          <div ref={listRef} className="max-h-[68vh] overflow-y-auto p-2 hko-sidebar-scroll">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-400">Sin resultados para “{query}”</p>
                <p className="mt-1 text-xs text-slate-600">Prueba con una capacidad, repositorio o responsable.</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.20em] text-slate-600">{group}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const index = runningIndex++;
                    const active = index === activeIndex;

                    return (
                      <button
                        key={item.id}
                        data-idx={index}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={[
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-sky-300/25 bg-sky-400/12 text-white"
                            : "border-transparent text-slate-400 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <Icon size={18} className={active ? "text-sky-300" : "text-slate-500"} />
                        <span className="flex-1 text-[13px] font-bold tracking-[0.02em]">{item.label}</span>
                        {active ? <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-slate-400">↵</kbd> : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
              <span>↑↓ Navegar</span>
              <span>↵ Abrir</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">Hocker ONE</span>
          </div>
        </div>
      </div>
    </>
  );
}
