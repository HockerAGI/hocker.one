"use client";

import type { DashboardSummary } from "@/lib/hocker-dashboard";
import {
  describeOperationalAction,
  getExecutiveMood,
  getExecutiveMoodCopy,
  getExecutiveMoodLabel,
  getExecutiveStatusLabel,
} from "@/lib/nova-executive-language";

function ExecutiveMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{hint}</p>
    </div>
  );
}

export function NovaExecutiveSurface({
  summary,
  liveApps,
  liveAgis,
  liveServices,
}: {
  summary: DashboardSummary;
  liveApps: number;
  liveAgis: number;
  liveServices: number;
}) {
  const mood = getExecutiveMood(summary);
  const pendingActions = summary.recentCommands.filter(
    (item) =>
      item.status === "queued" ||
      item.status === "running" ||
      item.status === "needs_approval",
  ).length;

  const lastAction = summary.recentCommands[0];

  return (
    <section className="rounded-[34px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),#07101f] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.30em] text-cyan-300">
            Centro de Operaciones NOVA
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            NOVA está supervisando Hocker ONE.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            {getExecutiveMoodCopy(mood)}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
            Estado general
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getExecutiveMoodLabel(mood)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <ExecutiveMetric label="Producción" value="Activa" hint="pulso visible y rutas protegidas" />
        <ExecutiveMetric label="Seguridad" value="Protegida" hint="candado de base de datos activo" />
        <ExecutiveMetric label="Módulos" value={String(liveApps + liveAgis + liveServices)} hint="apps, AGIs y servicios bajo lectura" />
        <ExecutiveMetric label="Acciones" value={String(pendingActions)} hint="internas pendientes o en proceso" />
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0b1526] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
          Última lectura ejecutiva
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {lastAction
            ? `${describeOperationalAction(lastAction.command)} · ${getExecutiveStatusLabel(lastAction.status)}`
            : "Sin acciones recientes. El sistema permanece en supervisión estable."}
        </p>
      </div>
    </section>
  );
}
