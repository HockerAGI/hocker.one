"use client";

import {
  Activity,
  Bot,
  Boxes,
  Clock3,
  GitBranch,
  Radio,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Waypoints,
} from "lucide-react";

import type {
  DashboardSummary,
  DashboardMetric,
  DashboardEventItem,
  DashboardCommandItem,
  AppRegistryItem,
  AgiRegistryItem,
  RepoRegistryItem,
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

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-slate-950/45 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="shell-card p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.36em] text-slate-500">
        {metric.label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
        {metric.value}
      </p>
      <p className="mt-2 text-sm text-slate-400">{metric.hint}</p>
    </div>
  );
}

function RegistryCard({
  title,
  subtitle,
  note,
  status,
  chips,
}: {
  title: string;
  subtitle: string;
  note: string;
  status: string;
  chips: string[];
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-slate-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
            getStatusTone(status),
          ].join(" ")}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1"
          >
            {chip}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function FeedCard({
  title,
  subtitle,
  time,
  tone,
}: {
  title: string;
  subtitle: string;
  time: string;
  tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-slate-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
        </div>
        <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]", tone].join(" ")}>
          activo
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        <Clock3 className="h-3.5 w-3.5 text-sky-300" />
        {time}
      </div>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <p className="section-kicker">{kicker}</p>
      <h3 className="section-title">{title}</h3>
      <p className="section-copy">{copy}</p>
    </div>
  );
}

export default function DashboardClient({ summary, className }: Props) {
  const liveApps = summary.apps.filter((item) => item.status === "live" || item.status === "ready").length;
  const liveAgis = summary.agis.filter((item) => item.status === "live" || item.status === "ready").length;
  const liveServices = summary.services.filter((item) => item.status === "live").length;

  return (
    <div className={className}>
      <section className="relative overflow-hidden rounded-[38px] border border-white/6 bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(2,6,23,0.28)] backdrop-blur-3xl sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />

        <div className="relative">
          <div className="rounded-[32px] border border-white/6 bg-slate-950/45 p-6 shadow-[0_18px_80px_rgba(2,6,23,0.18)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.42em] text-sky-300/80">
                  <Sparkles className="h-4 w-4" />
                  Hocker ONE · Centro de control
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Estado ejecutivo,
                  <span className="block text-sky-300">lectura operativa y control real.</span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Todo el ecosistema se concentra aquí con menos ruido: señal, registros,
                  infraestructura, eventos y conexiones externas en una sola vista.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[26rem] xl:grid-cols-1">
                <HeroStat label="Apps activas" value={String(liveApps)} hint="módulos listos o en vivo" />
                <HeroStat label="AGIs listas" value={String(liveAgis)} hint="núcleos con señal útil" />
                <HeroStat label="Servicios vivos" value={String(liveServices)} hint="conexiones externas saludables" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {summary.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-6">
              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Registro vivo"
                  title="Apps y AGIs"
                  copy="Lectura rápida para saber qué está activo, qué está listo y qué sigue en evolución."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                      <Boxes className="h-4 w-4 text-sky-300" />
                      Apps
                    </div>
                    {summary.apps.map((app: AppRegistryItem) => (
                      <RegistryCard
                        key={app.key}
                        title={app.title}
                        subtitle={app.subtitle}
                        note={app.note}
                        status={app.status}
                        chips={[app.integration, app.projectId]}
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                      <Bot className="h-4 w-4 text-sky-300" />
                      AGIs
                    </div>
                    {summary.agis.map((agi: AgiRegistryItem) => (
                      <RegistryCard
                        key={agi.key}
                        title={agi.title}
                        subtitle={agi.subtitle}
                        note={agi.note}
                        status={agi.status}
                        chips={[agi.integration, agi.nodeId]}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Integridad"
                  title="Repositorios"
                  copy="Conexión de código y ramas principales con lectura clara para seguimiento operativo."
                />

                <div className="grid gap-4">
                  {summary.repos.map((repo: RepoRegistryItem) => (
                    <RegistryCard
                      key={repo.key}
                      title={repo.title}
                      subtitle={repo.subtitle}
                      note={repo.note}
                      status={repo.status}
                      chips={[repo.branch, "mainline"]}
                    />
                  ))}
                </div>
              </section>

              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Servicios"
                  title="Conectividad externa"
                  copy="Estado visible para endpoints, integraciones y chequeo rápido de salud."
                />
                <ExternalServicesSection services={summary.services} />
              </section>
            </div>

            <div className="space-y-6">
              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Señal del sistema"
                  title="Estado en tiempo real"
                  copy="Nodos, comandos y eventos recientes sin salir del dashboard."
                />
                <SystemStatus summary={summary} />
              </section>

              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Actividad"
                  title="Eventos recientes"
                  copy="Lo último que generó señal útil dentro del sistema."
                />

                <div className="space-y-3">
                  {summary.recentEvents.length ? (
                    summary.recentEvents.map((event: DashboardEventItem) => (
                      <FeedCard
                        key={event.id}
                        title={event.title}
                        subtitle={event.detail}
                        time={formatTime(event.at)}
                        tone={event.level === "error"
                          ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                          : event.level === "warn"
                            ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
                            : "border-sky-400/20 bg-sky-500/10 text-sky-300"}
                      />
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/6 bg-slate-950/45 p-4 text-sm text-slate-400">
                      Sin eventos recientes.
                    </div>
                  )}
                </div>
              </section>

              <section className="shell-panel p-5">
                <SectionHeader
                  kicker="Runtime"
                  title="Comandos recientes"
                  copy="Lectura de cola, ejecución y cierre sin ruido."
                />

                <div className="space-y-3">
                  {summary.recentCommands.length ? (
                    summary.recentCommands.map((command: DashboardCommandItem) => (
                      <div
                        key={command.id}
                        className="rounded-[22px] border border-white/6 bg-slate-950/45 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{command.command}</p>
                            <p className="mt-1 text-xs text-slate-400">{command.projectId}</p>
                          </div>
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]",
                              getStatusTone(command.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(command.status)}
                          </span>
                        </div>

                        <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                          <TerminalSquare className="h-3.5 w-3.5 text-sky-300" />
                          {formatTime(command.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/6 bg-slate-950/45 p-4 text-sm text-slate-400">
                      Sin comandos recientes.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
