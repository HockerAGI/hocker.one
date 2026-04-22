"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Clock3,
  CircleDot,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import type {
  DashboardSummary,
  DashboardMetric,
  DashboardEventItem,
  DashboardCommandItem,
} from "@/lib/hocker-dashboard";
import { getStatusLabel, getStatusTone } from "@/lib/hocker-dashboard";

import SystemStatus from "@/components/SystemStatus";
import ExternalServicesSection from "@/components/dashboard/ExternalServicesSection";

type Props = {
  summary: DashboardSummary;
  className?: string;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({ metric, index }: { metric: DashboardMetric; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.16)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.07),transparent_24%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.38em] text-slate-500">
          {metric.label}
        </p>
        <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {metric.value}
        </p>
        <p className="mt-2 text-sm text-slate-400">{metric.hint}</p>
      </div>
    </motion.div>
  );
}

function sectionTitle(title: string, detail: string) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300/80">
          {detail}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-white">{title}</h3>
      </div>
    </div>
  );
}

export default function DashboardClient({ summary, className }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "ops" | "signals">("overview");

  const liveApps = useMemo(
    () => summary.apps.filter((item) => item.status === "live" || item.status === "ready").length,
    [summary.apps],
  );

  const liveAgis = useMemo(
    () => summary.agis.filter((item) => item.status === "live" || item.status === "ready").length,
    [summary.agis],
  );

  const liveServices = useMemo(
    () => summary.services.filter((item) => item.status === "live").length,
    [summary.services],
  );

  const latestEvent = summary.recentEvents[0];
  const latestCommand = summary.recentCommands[0];

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[36px] border border-white/5 bg-slate-950/55 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.09),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.07),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />

        <div className="relative p-5 sm:p-6 lg:p-7">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-[32px] border border-white/5 bg-white/[0.03] p-6 shadow-[0_18px_80px_rgba(2,6,23,0.18)]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.42em] text-sky-300/80">
                  <Sparkles className="h-4 w-4" />
                  HOCKER ONE · Control plane vivo
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Centro de mando con lectura ejecutiva, señal real y visión de producto.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Todo el ecosistema se ve aquí como una sola superficie: apps, AGIs, nodos,
                  repos, eventos y servicios externos. Menos ruido. Más verdad.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[24rem] lg:grid-cols-1">
                <div className="rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    <Activity className="h-4 w-4 text-sky-300" />
                    Apps activas
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{liveApps}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    <Bot className="h-4 w-4 text-sky-300" />
                    AGIs listas
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{liveAgis}</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-sky-300" />
                    Servicios vivos
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{liveServices}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { key: "overview", label: "Resumen" },
                { key: "ops", label: "Operación" },
                { key: "signals", label: "Señales" },
              ].map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key as typeof activeTab)}
                    className={[
                      "rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all",
                      active
                        ? "border-sky-400/20 bg-sky-400/10 text-sky-200 shadow-[0_0_24px_rgba(14,165,233,0.12)]"
                        : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {summary.metrics.map((metric, index) => (
              <MetricCard key={metric.label} metric={metric} index={index} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-6">
              <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                {sectionTitle("Apps y AGIs", "Estado del ecosistema")}

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                      Apps
                    </p>
                    {summary.apps.map((app) => (
                      <div
                        key={app.key}
                        className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-black text-white">{app.title}</h4>
                            <p className="mt-1 text-xs text-slate-400">{app.subtitle}</p>
                          </div>
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
                              getStatusTone(app.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(app.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                          <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                            {app.integration}
                          </span>
                          <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                            {app.projectId}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">{app.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                      AGIs
                    </p>
                    {summary.agis.map((agi) => (
                      <div
                        key={agi.key}
                        className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-black text-white">{agi.title}</h4>
                            <p className="mt-1 text-xs text-slate-400">{agi.subtitle}</p>
                          </div>
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
                              getStatusTone(agi.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(agi.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                          <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                            {agi.integration}
                          </span>
                          <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                            {agi.nodeId}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">{agi.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                {sectionTitle("Repos conectados", "Código y despliegue")}

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {summary.repos.map((repo) => (
                    <div
                      key={repo.key}
                      className="rounded-[24px] border border-white/5 bg-slate-950/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-white">{repo.title}</h4>
                          <p className="mt-1 text-xs text-slate-400">{repo.subtitle}</p>
                        </div>
                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
                            getStatusTone(repo.status),
                          ].join(" ")}
                        >
                          {getStatusLabel(repo.status)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                        <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                          {repo.branch}
                        </span>
                        <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1">
                          {repo.key}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">{repo.note}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                  {sectionTitle("Últimos eventos", "Señales del sistema")}

                  <div className="mt-5 space-y-3">
                    {summary.recentEvents.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay eventos recientes.</p>
                    ) : (
                      summary.recentEvents.map((event) => (
                        <EventItem key={event.id} item={event} />
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                  {sectionTitle("Cola reciente", "Comandos en movimiento")}

                  <div className="mt-5 space-y-3">
                    {summary.recentCommands.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay comandos recientes.</p>
                    ) : (
                      summary.recentCommands.map((command) => (
                        <CommandItem key={command.id} item={command} />
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <SystemStatus summary={summary} />

              <ExternalServicesSection services={summary.services} />

              <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300/80">
                      Momento
                    </p>
                    <h3 className="mt-2 text-lg font-black text-white">Última actualización</h3>
                  </div>
                  <Clock3 className="h-5 w-5 text-sky-300" />
                </div>

                <div className="mt-4 rounded-[24px] border border-white/5 bg-slate-950/45 p-4">
                  <p className="text-xs text-slate-400">
                    Corte de datos: <span className="text-slate-200">{formatTime(summary.snapshotAt)}</span>
                  </p>
                  {latestEvent ? (
                    <p className="mt-3 text-sm text-slate-200">
                      Última señal: <span className="font-bold text-white">{latestEvent.title}</span>
                    </p>
                  ) : null}
                  {latestCommand ? (
                    <p className="mt-2 text-sm text-slate-200">
                      Último comando: <span className="font-bold text-white">{latestCommand.command}</span>
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.18)]">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  <Workflow className="h-4 w-4 text-sky-300" />
                  Lectura operativa
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p className="leading-relaxed">
                    Si una app está “lista” pero no “viva”, el problema es de despliegue o conexión.
                  </p>
                  <p className="leading-relaxed">
                    Si una AGI aparece “activa” pero no responde, el drift está en contrato o memoria.
                  </p>
                  <p className="leading-relaxed">
                    Si el servicio externo cae, la UI no se rompe: solo marca la señal y sigue.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventItem({ item }: { item: DashboardEventItem }) {
  return (
    <div className="rounded-[22px] border border-white/5 bg-slate-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{item.title}</p>
          <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
        </div>
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
            item.level === "error"
              ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
              : item.level === "warn"
                ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
                : "border-sky-400/20 bg-sky-500/10 text-sky-300",
          ].join(" ")}
        >
          {item.level}
        </span>
      </div>

      <div className="mt-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        {formatShortDate(item.at)}
      </div>
    </div>
  );
}

function CommandItem({ item }: { item: DashboardCommandItem }) {
  return (
    <div className="rounded-[22px] border border-white/5 bg-slate-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{item.command}</p>
          <p className="mt-1 text-xs text-slate-400">{item.projectId}</p>
        </div>
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
            getStatusTone(item.status),
          ].join(" ")}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="mt-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        {formatShortDate(item.createdAt)}
      </div>
    </div>
  );
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}