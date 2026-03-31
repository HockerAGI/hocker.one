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
    case "blue": return "border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.2)]";
    case "emerald": return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    case "amber": return "border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    case "slate": return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    default: return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function AgisRegistry({ className = "", title = "Células Operativas", subtitle, items = DEFAULT_AGIS, ...rest }: AgisRegistryProps) {
  const list = useMemo(() => items, [items]);

  return (
    <section className={`flex flex-col h-full ${className}`} {...rest}>
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex gap-1.5">
          <div className="h-1.5 w-4 rounded-full bg-sky-500/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {list.map((item, idx) => (
          <article
            key={item.name}
            className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-5 transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-black tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  {item.name}
                </div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {item.role}
                </div>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${accentClasses(item.accent)}`}>
                {item.status}
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
              {item.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
