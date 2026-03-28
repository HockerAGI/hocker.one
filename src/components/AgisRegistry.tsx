"use client";

import { useMemo } from "react";

type AgiItem = {
  name: string;
  role: string;
  status: string;
  desc: string;
  accent: "blue" | "emerald" | "amber" | "slate";
};

type AgisRegistryProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  items?: AgiItem[];
  [key: string]: unknown;
};

const DEFAULT_AGIS: AgiItem[] = [
  {
    name: "NOVA",
    role: "Centro de mando",
    status: "Activa",
    desc: "Orquesta la visión general del ecosistema.",
    accent: "blue",
  },
  {
    name: "Candy Ads",
    role: "Creatividad",
    status: "Disponible",
    desc: "Contenido visual y emocional para marca y ventas.",
    accent: "emerald",
  },
  {
    name: "Nova Ads",
    role: "Publicidad",
    status: "Disponible",
    desc: "Mensajes, campañas y estructura de captación.",
    accent: "blue",
  },
  {
    name: "PRO IA",
    role: "Video",
    status: "Preparada",
    desc: "Piezas profesionales y presentaciones de alto impacto.",
    accent: "amber",
  },
  {
    name: "Trackhok",
    role: "Rastreo",
    status: "Pendiente",
    desc: "Control de ubicación y visibilidad operativa.",
    accent: "slate",
  },
  {
    name: "NEXPA",
    role: "Seguridad",
    status: "Pendiente",
    desc: "Capa de activación y control remoto.",
    accent: "slate",
  },
];

function accentClasses(accent: AgiItem["accent"]) {
  switch (accent) {
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function AgisRegistry({
  className = "",
  title = "Registro de agentes",
  subtitle = "Vista general de las inteligencias y su papel dentro del ecosistema.",
  items = DEFAULT_AGIS,
}: AgisRegistryProps) {
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.status === "Activa" || item.status === "Disponible").length;
    const pending = total - active;

    return { total, active, pending };
  }, [items]);

  return (
    <section className={className}>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              Inteligencias activas
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Total
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                Activas
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-900">{stats.active}</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
                Pendientes
              </div>
              <div className="mt-1 text-2xl font-black text-amber-900">{stats.pending}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.name}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-950">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                    {item.role}
                  </div>
                </div>
                <div
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] ${accentClasses(item.accent)}`}
                >
                  {item.status}
                </div>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
          Si todavía no ves datos vivos aquí, la pantalla se mantiene funcional y lista para conectar
          el origen real cuando lo actives.
        </div>
      </div>
    </section>
  );
}