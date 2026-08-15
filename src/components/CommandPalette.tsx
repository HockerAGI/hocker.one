"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AppWindow,
  Bot,
  Boxes,
  Database,
  FileCheck2,
  Search,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { HOCKER_NAVIGATION, HOCKER_SECONDARY_NAVIGATION } from "@/lib/hocker-navigation";
import { OPERATIONS_CATALOG, type OperationsCatalogKind } from "@/lib/operations-catalog";

type PaletteItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  keywords?: string;
};

const NAVIGATION_ITEMS: PaletteItem[] = HOCKER_NAVIGATION.flatMap((section) =>
  section.items.map((item) => ({
    id: `nav-${item.id}`,
    label: item.label,
    href: item.href,
    icon: item.icon,
    group: section.label,
    keywords: item.keywords,
  })),
);

const SECONDARY_ITEMS: PaletteItem[] = HOCKER_SECONDARY_NAVIGATION.map((item) => ({
  id: `secondary-${item.id}`,
  label: item.label,
  href: item.href,
  icon: item.icon,
  group: item.group,
  keywords: item.keywords,
}));

const SPECIAL_ITEMS: PaletteItem[] = [
  { id: "security-rls", label: "Políticas RLS", href: "/security/rls", icon: ShieldCheck, group: "Seguridad", keywords: "seguridad supabase rls policies tablas" },
  { id: "security-grants", label: "Permisos", href: "/security/grants", icon: ShieldCheck, group: "Seguridad", keywords: "seguridad permisos grants roles" },
  { id: "security-hardening", label: "Hardening", href: "/security/hardening", icon: ShieldCheck, group: "Seguridad", keywords: "seguridad hardening vulnerabilidades" },
  { id: "memory-review", label: "Revisión de memoria", href: "/memory/review", icon: FileCheck2, group: "Recursos", keywords: "memoria revisión evidencia aprendizaje syntia" },
  { id: "chido-dashboard", label: "Chido Dashboard", href: "/chido/dashboard", icon: Activity, group: "Chido", keywords: "casino dashboard monitoreo" },
  { id: "chido-admin", label: "Chido Admin", href: "/chido/admin", icon: ShieldCheck, group: "Chido", keywords: "casino admin kyc depósitos retiros pausa" },
  { id: "chido-ops", label: "Chido Ops", href: "/chido/ops", icon: Database, group: "Chido", keywords: "casino operaciones monitoring" },
  { id: "jurix", label: "Jurix", href: "/admin/jurix", icon: FileCheck2, group: "Seguridad", keywords: "jurix legal compliance auditoria exportar" },
];

const BASE_ITEMS = [...NAVIGATION_ITEMS, ...SECONDARY_ITEMS, ...SPECIAL_ITEMS];

function catalogIcon(kind: OperationsCatalogKind): LucideIcon {
  if (kind === "app") return AppWindow;
  if (kind === "service") return ServerCog;
  if (kind === "agent") return Bot;
  return Boxes;
}

function catalogGroup(kind: OperationsCatalogKind): string {
  if (kind === "app") return "Apps";
  if (kind === "service") return "Servicios";
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

const SEARCHABLE_ITEMS = [...BASE_ITEMS, ...CATALOG_ITEMS].filter(
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
    if (!normalized) return BASE_ITEMS;

    return SEARCHABLE_ITEMS.filter((item) =>
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
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default bg-black/65 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Cerrar búsqueda"
      />

      <div className="fixed left-1/2 top-[8%] z-[201] w-[94vw] max-w-[700px] -translate-x-1/2 sm:top-[10%]">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar en Hocker ONE"
          className="overflow-hidden rounded-[22px] border border-white/10 bg-[#07101f]/98 shadow-[0_32px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
            <Search className="h-5 w-5 shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar vista, app, AGI, herramienta o función…"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white placeholder:text-slate-500 focus:outline-none"
              aria-label="Buscar en Hocker ONE"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-400 sm:block">ESC</kbd>
          </div>

          <div ref={listRef} className="max-h-[68dvh] overflow-y-auto p-2 hko-sidebar-scroll">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-300">Sin resultados para “{query}”</p>
                <p className="mt-1 text-xs text-slate-600">Prueba con una app, AGI, recurso o acción.</p>
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
                        type="button"
                        data-idx={index}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={[
                          "flex min-h-11 w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition",
                          active
                            ? "border-sky-300/20 bg-sky-400/10 text-white"
                            : "border-transparent text-slate-400 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <Icon className={active ? "h-[18px] w-[18px] text-sky-300" : "h-[18px] w-[18px] text-slate-500"} />
                        <span className="flex-1 text-[13px] font-bold tracking-[0.01em]">{item.label}</span>
                        {active ? <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-slate-400">↵</kbd> : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5">
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
