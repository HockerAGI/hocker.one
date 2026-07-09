"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
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
  ShieldCheck,
  Sparkles,
  Database,
} from "lucide-react";

type IconType = typeof Home;

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  group: string;
  keywords?: string;
};

const PALETTE_ITEMS: PaletteItem[] = [
  // Núcleo
  { id: "owner", label: "Inicio", href: "/owner", icon: Home, group: "Núcleo", keywords: "home dashboard inicio panel" },
  { id: "map", label: "Mapa", href: "/map", icon: MapIcon, group: "Núcleo", keywords: "map mapa overview" },
  { id: "live", label: "Sistema en vivo", href: "/live", icon: Activity, group: "Núcleo", keywords: "live vivo realtime monitoreo" },
  { id: "chat", label: "NOVA Chat", href: "/chat", icon: Bot, group: "Núcleo", keywords: "nova chat ai agi conversacion" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: CircleDot, group: "Núcleo", keywords: "dashboard sistema panel" },

  // Operación
  { id: "commands", label: "Tareas", href: "/commands", icon: CheckSquare, group: "Operación", keywords: "commands tareas queue cola" },
  { id: "nodes", label: "Nodos", href: "/nodes", icon: Network, group: "Operación", keywords: "nodes nodos agent agente" },
  { id: "status", label: "Estado del sistema", href: "/status", icon: Activity, group: "Operación", keywords: "status estado health salud" },

  // Ecosistema
  { id: "apps", label: "Apps", href: "/apps", icon: Grid2X2, group: "Ecosistema", keywords: "apps aplicaciones" },
  { id: "agis", label: "AGIs", href: "/agis", icon: Sparkles, group: "Ecosistema", keywords: "agis inteligencias" },
  { id: "integrations", label: "Integraciones", href: "/integrations", icon: Plug, group: "Ecosistema", keywords: "integrations integraciones mcp conectores" },
  { id: "memory", label: "Memoria IA", href: "/memory", icon: Brain, group: "Ecosistema", keywords: "memory memoria ia aprendizaje" },
  { id: "supply", label: "Supply", href: "/supply", icon: Package, group: "Ecosistema", keywords: "supply suministros" },
  { id: "chido", label: "Chido Casino", href: "/chido", icon: Dices, group: "Ecosistema", keywords: "chido casino juegos apuestas" },
  { id: "chido-dashboard", label: "Chido Dashboard", href: "/chido/dashboard", icon: Activity, group: "Ecosistema", keywords: "chido dashboard casino monitoreo" },
  { id: "chido-admin", label: "Chido Admin", href: "/chido/admin", icon: ShieldCheck, group: "Ecosistema", keywords: "chido admin kyc depositos retiros pausa" },
  { id: "chido-ops", label: "Chido Ops", href: "/chido/ops", icon: Database, group: "Ecosistema", keywords: "chido ops operaciones monitoring" },

  // Gobernanza
  { id: "security", label: "Seguridad", href: "/security", icon: ShieldCheck, group: "Gobernanza", keywords: "security seguridad rls" },
  { id: "governance", label: "Gobierno", href: "/governance", icon: Landmark, group: "Gobernanza", keywords: "governance gobierno auditoria" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd+K / Ctrl+K to open, Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  // Filter items by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE_ITEMS;
    return PALETTE_ITEMS.filter((item) => {
      const haystack = `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  // Scroll active item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const navigate = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) navigate(item);
    }
  }

  if (!open) return null;

  // Group filtered items using the global Map constructor
  const grouped: Array<[string, PaletteItem[]]> = [];
  const groupMap = new globalThis.Map<string, PaletteItem[]>();
  for (const item of filtered) {
    const list = groupMap.get(item.group) ?? [];
    list.push(item);
    groupMap.set(item.group, list);
  }
  for (const entry of groupMap.entries()) {
    grouped.push(entry);
  }

  // Flatten for index tracking
  let runningIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[15%] z-[201] w-[92vw] max-w-[640px] -translate-x-1/2">
        <div className="overflow-hidden rounded-[24px] border border-white/15 bg-[#070d1a] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
            <Search size={20} className="shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar páginas, AGIs, módulos…"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-slate-500 focus:outline-none"
              aria-label="Buscar en Hocker ONE"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 hko-sidebar-scroll">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-400">Sin resultados para “{query}”</p>
                <p className="mt-1 text-xs text-slate-600">Intenta con otro término.</p>
              </div>
            ) : (
              grouped.map(([group, items]: [string, PaletteItem[]]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.20em] text-slate-600">
                    {group}
                  </p>
                  {items.map((item: PaletteItem) => {
                    const Icon = item.icon;
                    const idx = runningIndex++;
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={[
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
                          active
                            ? "border-sky-300/25 bg-sky-400/12 text-white"
                            : "border-transparent text-slate-400 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <Icon size={18} className={active ? "text-sky-300" : "text-slate-500"} />
                        <span className="flex-1 text-[13px] font-bold tracking-[0.02em]">
                          {item.label}
                        </span>
                        {active && (
                          <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px]">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px]">↵</kbd>
                Abrir
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
              Hocker ONE
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
