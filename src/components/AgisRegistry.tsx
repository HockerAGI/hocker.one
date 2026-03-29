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
  { name: "NOVA", role: "Centro de mando", status: "Activa", desc: "Orquesta la visión general del ecosistema.", accent: "blue" },
  { name: "Candy Ads", role: "Creatividad", status: "Disponible", desc: "Contenido visual y emocional para marca y ventas.", accent: "emerald" },
  { name: "Nova Ads", role: "Publicidad", status: "Disponible", desc: "Mensajes, campañas y estructura de captación.", accent: "blue" },
  { name: "PRO IA", role: "Video", status: "Preparada", desc: "Piezas profesionales y presentaciones de alto impacto.", accent: "amber" },
  { name: "Trackhok", role: "Rastreo", status: "Pendiente", desc: "Control de ubicación y visibilidad operativa.", accent: "slate" },
  { name: "NEXPA", role: "Seguridad", status: "Pendiente", desc: "Capa de activación y control remoto.", accent: "slate" },
];

function accentClasses(accent: AgiItem["accent"]) {
  switch (accent) {
    case "blue":
      return "border-sky-400/20 bg-sky-500/10 text-sky-200";
    case "emerald":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "amber":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
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
      <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Inteligencias activas</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center md:gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Total</div>
              <div className="mt-1 text-2xl font-black text-white">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">Activas</div>
              <div className="mt-1 text-2xl font-black text-emerald-100">{stats.active}</div>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Pendientes</div>
              <div className="mt-1 text-2xl font-black text-amber-100">{stats.pending}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.name}
              className="group relative rounded-[24px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/20 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black tracking-tight text-white group-hover:text-sky-300">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    {item.role}
                  </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] ${accentClasses(item.accent)}`}>
                  {item.status}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{item.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p>
            Si todavía no ves datos vivos aquí, la pantalla sigue lista para conectar el origen real cuando lo actives en Supabase.
          </p>
        </div>
      </div>
    </section>
  );
}