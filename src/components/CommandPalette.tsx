"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AppWindow, Bot, Boxes, Search, ServerCog } from "lucide-react";
import { HOCKER_NAVIGATION, HOCKER_SECONDARY_NAVIGATION } from "@/lib/hocker-navigation";
import { OPERATIONS_CATALOG, type OperationsCatalogKind } from "@/lib/operations-catalog";

type PaletteItem = { id: string; label: string; href: string; icon: LucideIcon; group: string; keywords?: string };

const PRIMARY_ITEMS: PaletteItem[] = HOCKER_NAVIGATION.map((section) => ({ id: `main-${section.id}`, label: section.label, href: section.href, icon: section.icon, group: "Principal", keywords: section.items.map((item) => item.keywords).join(" ") }));
const SECONDARY_ITEMS: PaletteItem[] = HOCKER_SECONDARY_NAVIGATION.map((item) => {
  const section = HOCKER_NAVIGATION.find((candidate) => candidate.items.some((value) => value.id === item.id));
  return { id: `nav-${item.id}`, label: item.label, href: item.href, icon: item.icon, group: section?.label ?? "Más", keywords: item.keywords };
});

function catalogIcon(kind: OperationsCatalogKind): LucideIcon {
  if (kind === "app") return AppWindow;
  if (kind === "service") return ServerCog;
  if (kind === "agent") return Bot;
  return Boxes;
}

const CATALOG_ITEMS: PaletteItem[] = OPERATIONS_CATALOG.filter((item) => item.href.startsWith("/")).map((item) => ({
  id: `catalog-${item.id}`,
  label: item.label,
  href: item.href,
  icon: catalogIcon(item.kind),
  group: item.kind === "agent" ? "AGIs" : item.kind === "app" ? "Apps" : "Recursos",
  keywords: [item.status, item.repository ?? "", item.runtime ?? "", item.internalTruth, ...item.keywords, ...item.ownerAgis, ...item.capabilities].join(" "),
}));

const SEARCHABLE_ITEMS = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS, ...CATALOG_ITEMS].filter((item, index, all) => all.findIndex((candidate) => candidate.href === item.href && candidate.label === item.label) === index);

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => { if (open) { setQuery(""); setActiveIndex(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("es-MX");
    return value ? SEARCHABLE_ITEMS.filter((item) => `${item.label} ${item.group} ${item.keywords ?? ""}`.toLocaleLowerCase("es-MX").includes(value)) : [...PRIMARY_ITEMS, ...SECONDARY_ITEMS];
  }, [query]);

  const navigate = useCallback((item: PaletteItem) => { setOpen(false); router.push(item.href); }, [router]);
  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-[200] cursor-default bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Cerrar búsqueda" />
      <div className="fixed left-1/2 top-[8%] z-[201] w-[94vw] max-w-[680px] -translate-x-1/2">
        <div role="dialog" aria-modal="true" aria-label="Buscar" className="overflow-hidden rounded-[24px] border border-white/10 bg-[#070d1a]/98 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <Search className="h-5 w-5 text-slate-500" />
            <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, Math.max(filtered.length - 1, 0))); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)); }
              if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); navigate(filtered[activeIndex]!); }
            }} placeholder="Buscar en Hocker One…" className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600" aria-label="Buscar en Hocker One" />
          </div>
          <div className="max-h-[68dvh] overflow-y-auto p-2">
            {filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">Sin resultados</p> : filtered.map((item, index) => {
              const Icon = item.icon;
              return <button key={`${item.id}-${item.href}`} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => navigate(item)} className={["flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left", index === activeIndex ? "bg-sky-400/12 text-white" : "text-slate-400 hover:bg-white/[0.04]"].join(" ")}><Icon className="h-4 w-4" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span><span className="text-[10px] text-slate-600">{item.group}</span></button>;
            })}
          </div>
        </div>
      </div>
    </>
  );
}
