"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AppWindow,
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  Filter,
  Search,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  OPERATIONS_STATUS_LABELS,
  type OperationsCatalogItem,
  type OperationsCatalogKind,
  type OperationsCatalogStatus,
} from "@/lib/operations-catalog";

type Props = {
  items: OperationsCatalogItem[];
};

type StatusFilter = OperationsCatalogStatus | "all";
type KindFilter = OperationsCatalogKind | "all";

const STATUS_ORDER: StatusFilter[] = ["all", "operational", "limited", "development", "planned"];

const KIND_LABELS: Record<KindFilter, string> = {
  all: "Todo",
  app: "Apps",
  service: "Servicios",
  agent: "AGIs",
  area: "Áreas",
};

function statusClasses(status: OperationsCatalogStatus) {
  if (status === "operational") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "limited") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "development") return "border-sky-300/25 bg-sky-300/10 text-sky-100";
  return "border-slate-300/15 bg-slate-300/[0.07] text-slate-300";
}

function kindIcon(kind: OperationsCatalogKind) {
  if (kind === "app") return AppWindow;
  if (kind === "service") return ServerCog;
  if (kind === "agent") return Sparkles;
  return Boxes;
}

function approvalLabel(approval: OperationsCatalogItem["approval"]) {
  if (approval === "owner_gate") return "Owner Gate";
  if (approval === "read_only") return "Solo lectura";
  if (approval === "manual") return "Control manual";
  return "Sin aprobación";
}

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export default function OperationsDiscovery({ items }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");

  const counts = useMemo(() => {
    return items.reduce(
      (current, item) => {
        current[item.status] += 1;
        return current;
      },
      { operational: 0, limited: 0, development: 0, planned: 0 },
    );
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-MX");

    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      if (!normalized) return true;

      const haystack = [
        item.label,
        item.summary,
        item.internalTruth,
        item.repository ?? "",
        item.runtime ?? "",
        ...item.keywords,
        ...item.ownerAgis,
        ...item.capabilities,
      ]
        .join(" ")
        .toLocaleLowerCase("es-MX");

      return haystack.includes(normalized);
    });
  }, [items, kind, query, status]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[34px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),rgba(255,255,255,0.035)] p-5 sm:p-6">
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <Search className="h-3.5 w-3.5" />
              Descubrimiento operativo
            </span>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Encuentra cualquier app, AGI, servicio o área sin conocer su ruta técnica.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Cada ficha separa lo que está operativo de lo que sigue en integración o roadmap. Los accesos de escritura permanecen sujetos a aprobación.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/chat" className="hocker-button-primary inline-flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Pedir acción a NOVA
            </Link>
            <Link href="/commands" className="hocker-button-secondary inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Ver aprobaciones
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[26px] border border-emerald-300/15 bg-emerald-300/[0.07] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/70">Operativo</p>
          <strong className="mt-2 block text-3xl font-black text-white">{counts.operational}</strong>
          <p className="mt-1 text-xs text-slate-400">Disponible con evidencia actual.</p>
        </div>
        <div className="rounded-[26px] border border-amber-300/15 bg-amber-300/[0.07] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/70">Con límites</p>
          <strong className="mt-2 block text-3xl font-black text-white">{counts.limited}</strong>
          <p className="mt-1 text-xs text-slate-400">Depende de nodo, integración o alcance.</p>
        </div>
        <div className="rounded-[26px] border border-sky-300/15 bg-sky-300/[0.07] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200/70">En desarrollo</p>
          <strong className="mt-2 block text-3xl font-black text-white">{counts.development}</strong>
          <p className="mt-1 text-xs text-slate-400">Existe diseño o implementación parcial.</p>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Planificado</p>
          <strong className="mt-2 block text-3xl font-black text-white">{counts.planned}</strong>
          <p className="mt-1 text-xs text-slate-400">Visión documentada, todavía no operativa.</p>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, función, repositorio, AGI o capacidad…"
            className="hocker-focus-ring w-full rounded-2xl border border-white/10 bg-slate-950/60 py-4 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500"
            type="search"
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={[
                  "rounded-full border px-3 py-2 text-xs font-bold transition",
                  status === option
                    ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-50"
                    : "border-white/10 bg-white/[0.035] text-slate-400 hover:text-white",
                ].join(" ")}
              >
                {option === "all" ? "Todos los estados" : OPERATIONS_STATUS_LABELS[option]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />
            {(Object.keys(KIND_LABELS) as KindFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={[
                  "shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition",
                  kind === option
                    ? "border-violet-300/30 bg-violet-300/12 text-violet-50"
                    : "border-white/10 bg-white/[0.035] text-slate-400 hover:text-white",
                ].join(" ")}
              >
                {KIND_LABELS[option]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-sm font-bold text-slate-300">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </p>
          <p className="text-xs text-slate-500">La disponibilidad puede cambiar según health y conexión.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => {
            const Icon = kindIcon(item.kind);
            const external = isExternal(item.href);
            const content = (
              <article className="group flex h-full flex-col rounded-[30px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.055]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses(item.status)}`}>
                    {OPERATIONS_STATUS_LABELS[item.status]}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{KIND_LABELS[item.kind]}</p>
                  <h2 className="mt-2 text-xl font-black tracking-[-0.035em] text-white">{item.label}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>

                  <div className="mt-4 rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Estado comprobable</p>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{item.internalTruth}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.capabilities.slice(0, 4).map((capability) => (
                      <span key={capability} className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.055] px-2.5 py-1 text-[10px] font-bold text-cyan-100/80">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-4 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                    <span>{item.ownerAgis.join(" · ") || "Responsable pendiente"}</span>
                  </div>
                  {item.repository ? (
                    <div className="flex items-start gap-2">
                      <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                      <span>{item.repository}</span>
                    </div>
                  ) : null}
                  {item.runtime ? (
                    <div className="flex items-start gap-2">
                      <ServerCog className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                      <span>{item.runtime}</span>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span>{approvalLabel(item.approval)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm font-bold text-cyan-100">
                  <span>Abrir ficha o módulo</span>
                  {external ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
                </div>
              </article>
            );

            return external ? (
              <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="block h-full">
                {content}
              </a>
            ) : (
              <Link key={item.id} href={item.href} className="block h-full">
                {content}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
            <CircleDot className="mx-auto h-8 w-8 text-slate-600" />
            <h2 className="mt-4 text-lg font-black text-white">No encontramos esa capacidad</h2>
            <p className="mt-2 text-sm text-slate-400">Prueba con el nombre de una app, AGI, repositorio o herramienta.</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/map" className="rounded-[26px] border border-cyan-300/15 bg-cyan-300/[0.07] p-4 transition hover:bg-cyan-300/10">
          <Boxes className="h-5 w-5 text-cyan-200" />
          <strong className="mt-3 block text-white">Ver mapa</strong>
          <span className="mt-1 block text-xs text-slate-400">Relaciones y rutas principales.</span>
        </Link>
        <Link href="/integrations" className="rounded-[26px] border border-violet-300/15 bg-violet-300/[0.07] p-4 transition hover:bg-violet-300/10">
          <Wrench className="h-5 w-5 text-violet-200" />
          <strong className="mt-3 block text-white">Herramientas y APIs</strong>
          <span className="mt-1 block text-xs text-slate-400">Estado vivo, permisos y eventos.</span>
        </Link>
        <Link href="/status" className="rounded-[26px] border border-emerald-300/15 bg-emerald-300/[0.07] p-4 transition hover:bg-emerald-300/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <strong className="mt-3 block text-white">Salud del sistema</strong>
          <span className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3 w-3" /> Señales y disponibilidad.</span>
        </Link>
      </section>
    </div>
  );
}
