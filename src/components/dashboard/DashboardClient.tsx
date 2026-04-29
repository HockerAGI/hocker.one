"use client";

import type { ComponentType, ReactNode } from "react";
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

import PageShell from "@/components/PageShell";
import SystemStatus from "@/components/SystemStatus";
import ExternalServicesSection from "@/components/dashboard/ExternalServicesSection";

type Props = {
  summary: DashboardSummary;
  className?: string;
};

type IconType = ComponentType<{
  className?: string;
  size?: number;
}>;

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

function SectionBlock({
  icon: Icon,
  kicker,
  title,
  copy,
  children,
}: {
  icon: IconType;
  kicker: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#07101f] p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
            {kicker}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {copy}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
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
    <div className="rounded-[24px] border border-white/10 bg-[#0b1526] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {hint}
      </p>
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0b1526] p-5">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
        <Activity size={18} />
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
        {metric.label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
        {metric.value}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {metric.hint}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.20em]",
        getStatusTone(status),
      ].join(" ")}
    >
      {getStatusLabel(status)}
    </span>
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
    <article className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{subtitle}</p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"
          >
            {chip}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">{note}</p>
    </article>
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
    <article className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{subtitle}</p>
        </div>

        <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.20em]", tone].join(" ")}>
          señal
        </span>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.20em] text-slate-500">
        <Clock3 size={14} className="text-sky-300" />
        {time}
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4 text-sm text-slate-400">
      {text}
    </div>
  );
}

function eventTone(level: DashboardEventItem["level"]) {
  if (level === "error") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  if (level === "warn") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-sky-400/20 bg-sky-500/10 text-sky-300";
}

export default function DashboardClient({ summary, className }: Props) {
  const liveApps = summary.apps.filter((item) => item.status === "live" || item.status === "ready").length;
  const liveAgis = summary.agis.filter((item) => item.status === "live" || item.status === "ready").length;
  const liveServices = summary.services.filter((item) => item.status === "live").length;

  return (
    <PageShell
      className={className}
      eyebrow="Hocker ONE · Centro de control"
      title="Estado ejecutivo"
      description="Lectura operativa, servicios reales, apps, AGIs, repositorios, comandos y señales recientes en una sola vista."
      actions={
        <div className="flex flex-wrap gap-2">
          <span className="shell-chip-brand">
            <Sparkles size={13} />
            Producción
          </span>
          <span className="shell-chip">
            Snapshot {formatTime(summary.snapshotAt)}
          </span>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <HeroStat label="Apps activas" value={String(liveApps)} hint="módulos listos o en vivo" />
        <HeroStat label="AGIs listas" value={String(liveAgis)} hint="núcleos con señal útil" />
        <HeroStat label="Servicios vivos" value={String(liveServices)} hint="conexiones externas saludables" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {summary.metrics.map((metric: DashboardMetric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-5">
          <SectionBlock
            icon={Boxes}
            kicker="Registro vivo"
            title="Apps y AGIs"
            copy="Lectura rápida para saber qué está activo, qué está listo y qué sigue en evolución."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  <Boxes size={16} className="text-sky-300" />
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
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  <Bot size={16} className="text-sky-300" />
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
          </SectionBlock>

          <SectionBlock
            icon={GitBranch}
            kicker="Integridad"
            title="Repositorios"
            copy="Conexión de código y ramas principales para seguimiento operativo."
          >
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
          </SectionBlock>

          <SectionBlock
            icon={Radio}
            kicker="Servicios"
            title="Conectividad externa"
            copy="Estado visible para endpoints, integraciones y chequeo rápido de salud."
          >
            <ExternalServicesSection services={summary.services} />
          </SectionBlock>
        </div>

        <div className="space-y-5">
          <SectionBlock
            icon={ShieldCheck}
            kicker="Sistema"
            title="Estado real"
            copy="Nodos, comandos y señales recientes sin salir del dashboard."
          >
            <SystemStatus summary={summary} />
          </SectionBlock>

          <SectionBlock
            icon={Waypoints}
            kicker="Actividad"
            title="Eventos recientes"
            copy="Últimas señales útiles generadas dentro del sistema."
          >
            <div className="space-y-3">
              {summary.recentEvents.length ? (
                summary.recentEvents.map((event: DashboardEventItem) => (
                  <FeedCard
                    key={event.id}
                    title={event.title}
                    subtitle={event.detail}
                    time={formatTime(event.at)}
                    tone={eventTone(event.level)}
                  />
                ))
              ) : (
                <EmptyState text="Sin eventos recientes." />
              )}
            </div>
          </SectionBlock>

          <SectionBlock
            icon={TerminalSquare}
            kicker="Runtime"
            title="Comandos recientes"
            copy="Lectura de cola, ejecución y cierre sin artefactos visuales."
          >
            <div className="space-y-3">
              {summary.recentCommands.length ? (
                summary.recentCommands.map((command: DashboardCommandItem) => (
                  <article
                    key={command.id}
                    className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-white">
                          {command.command}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {command.projectId}
                        </p>
                      </div>

                      <StatusBadge status={command.status} />
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.20em] text-slate-500">
                      <TerminalSquare size={14} className="text-sky-300" />
                      {formatTime(command.createdAt)}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState text="Sin comandos recientes." />
              )}
            </div>
          </SectionBlock>
        </div>
      </div>
    </PageShell>
  );
}
