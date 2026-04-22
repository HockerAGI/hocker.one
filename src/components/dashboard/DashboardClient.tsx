"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Clock3,
  Cpu,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import type {
  DashboardCommandItem,
  DashboardEventItem,
  DashboardMetric,
  DashboardSummary,
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

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="shell-card p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">{metric.label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{metric.value}</p>
      <p className="mt-2 text-sm text-slate-400">{metric.hint}</p>
    </div>
  );
}

function EventRow({ item }: { item: DashboardEventItem }) {
  return (
    <div className="shell-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{item.title}</p>
          <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
        </div>

        <span
          className={
            item.level === "error"
              ? "shell-chip-danger"
              : item.level === "warn"
                ? "shell-chip-warning"
                : "shell-chip-brand"
          }
        >
          {item.level}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Clock3 className="h-4 w-4" />
        {formatTime(item.at)}
      </div>
    </div>
  );
}

function CommandRow({ item }: { item: DashboardCommandItem }) {
  return (
    <div className="shell-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{item.command}</p>
          <p className="mt-1 text-sm text-slate-400">{item.projectId}</p>
        </div>

        <span className={getStatusTone(item.status)}>
          <span className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em]">
            {getStatusLabel(item.status)}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Clock3 className="h-4 w-4" />
        {formatTime(item.createdAt)}
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
  copy?: string;
}) {
  return (
    <div>
      <p className="section-kicker">{kicker}</p>
      <h2 className="section-title">{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
    </div>
  );
}

export default function DashboardClient({ summary, className }: Props) {
  const pendingApprovals = summary.recentCommands.filter((item) => item.status === "needs_approval").length;
  const runningCommands = summary.recentCommands.filter((item) => item.status === "running").length;

  return (
    <div className={className}>
      <div className="space-y-6">
        <section className="shell-panel-strong surface-grid overflow-hidden p-6 sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="section-kicker">Inicio · Control plane</p>
              <h1 className="h1-title mt-4">
                El ecosistema en una vista clara, usable y entendible.
              </h1>
              <p className="section-copy max-w-3xl">
                Aquí se resume qué está bien, qué requiere atención y cuál es la siguiente acción
                útil. Primero claridad. Después profundidad.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/chat" className="shell-button-primary">
                  Abrir NOVA
                  <Bot className="h-4 w-4" />
                </Link>
                <Link href="/commands" className="shell-button-secondary">
                  Ver operaciones
                  <TerminalSquare className="h-4 w-4" />
                </Link>
                <Link href="/nodes" className="shell-button-secondary">
                  Ver nodos
                  <Cpu className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="shell-card px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  Aprobaciones
                </div>
                <p className="mt-2 text-2xl font-black text-white">{pendingApprovals}</p>
              </div>

              <div className="shell-card px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Activity className="h-4 w-4 text-sky-300" />
                  En curso
                </div>
                <p className="mt-2 text-2xl font-black text-white">{runningCommands}</p>
              </div>

              <div className="shell-card px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  Snapshot
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{formatTime(summary.snapshotAt)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Salud del sistema"
                title="Estado general"
                copy="Lectura rápida del núcleo operativo y su actividad reciente."
              />

              <div className="mt-5">
                <SystemStatus summary={summary} />
              </div>
            </section>

            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Módulos"
                title="Apps y AGIs"
                copy="Bloques principales del ecosistema con estado y propósito."
              />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">Apps</p>
                  {summary.apps.map((app) => (
                    <div key={app.key} className="shell-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{app.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{app.subtitle}</p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em] ${getStatusTone(app.status)}`}
                        >
                          {getStatusLabel(app.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="shell-chip">{app.integration}</span>
                        <span className="shell-chip">{app.projectId}</span>
                      </div>

                      <p className="mt-3 text-sm text-slate-400">{app.note}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">AGIs</p>
                  {summary.agis.map((agi) => (
                    <div key={agi.key} className="shell-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">{agi.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{agi.subtitle}</p>
                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em] ${getStatusTone(agi.status)}`}
                        >
                          {getStatusLabel(agi.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="shell-chip">{agi.integration}</span>
                        <span className="shell-chip">{agi.nodeId}</span>
                      </div>

                      <p className="mt-3 text-sm text-slate-400">{agi.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Operaciones"
                title="Actividad reciente"
                copy="Lo más importante que cambió en eventos y comandos."
              />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                      Eventos
                    </p>
                    <Link href="/governance" className="text-xs font-bold text-sky-300 hover:text-sky-200">
                      Ver todo
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {summary.recentEvents.length === 0 ? (
                      <div className="shell-card p-4 text-sm text-slate-500">Sin eventos recientes.</div>
                    ) : (
                      summary.recentEvents.map((item) => <EventRow key={item.id} item={item} />)
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                      Comandos
                    </p>
                    <Link href="/commands" className="text-xs font-bold text-sky-300 hover:text-sky-200">
                      Abrir cola
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {summary.recentCommands.length === 0 ? (
                      <div className="shell-card p-4 text-sm text-slate-500">Sin comandos recientes.</div>
                    ) : (
                      summary.recentCommands.map((item) => <CommandRow key={item.id} item={item} />)
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Código y despliegue"
                title="Repos conectados"
                copy="Repos base del sistema y estado esperado de conexión."
              />

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {summary.repos.map((repo) => (
                  <div key={repo.key} className="shell-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">{repo.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{repo.subtitle}</p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.26em] ${getStatusTone(repo.status)}`}
                      >
                        {getStatusLabel(repo.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="shell-chip">{repo.branch}</span>
                      <span className="shell-chip">{repo.key}</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-400">{repo.note}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Siguiente acción"
                title="Acciones rápidas"
                copy="Entradas directas para una persona no técnica o para operación diaria."
              />

              <div className="mt-5 space-y-3">
                <Link href="/chat" className="shell-card flex items-center justify-between p-4 transition hover:bg-white/[0.05]">
                  <div>
                    <p className="text-sm font-bold text-white">Hablar con NOVA</p>
                    <p className="mt-1 text-sm text-slate-400">Abrir asistencia operativa y memoria.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-sky-300" />
                </Link>

                <Link href="/commands" className="shell-card flex items-center justify-between p-4 transition hover:bg-white/[0.05]">
                  <div>
                    <p className="text-sm font-bold text-white">Revisar aprobaciones</p>
                    <p className="mt-1 text-sm text-slate-400">Ver comandos pendientes o en curso.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-sky-300" />
                </Link>

                <Link href="/nodes" className="shell-card flex items-center justify-between p-4 transition hover:bg-white/[0.05]">
                  <div>
                    <p className="text-sm font-bold text-white">Estado de nodos</p>
                    <p className="mt-1 text-sm text-slate-400">Ver heartbeat y señales vivas.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-sky-300" />
                </Link>
              </div>
            </section>

            <ExternalServicesSection services={summary.services} />

            <section className="shell-panel p-5">
              <SectionHeader
                kicker="Notas de diseño"
                title="Cómo se debe sentir"
                copy="Simple al entrar, precisa al operar, profunda solo cuando hace falta."
              />

              <div className="mt-5 space-y-3">
                <div className="shell-card p-4">
                  <p className="text-sm font-bold text-white">Primero claridad</p>
                  <p className="mt-1 text-sm text-slate-400">
                    El usuario debe entender el estado general antes de ver detalles técnicos.
                  </p>
                </div>

                <div className="shell-card p-4">
                  <p className="text-sm font-bold text-white">Móvil primero</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Nada de desktop apretado. El flujo móvil debe ser directo y usable.
                  </p>
                </div>

                <div className="shell-card p-4">
                  <p className="text-sm font-bold text-white">NOVA sin decoración gratuita</p>
                  <p className="mt-1 text-sm text-slate-400">
                    La identidad visual de NOVA se reserva para su módulo, no para contaminar el shell.
                  </p>
                </div>

                <a
                  href="https://atlassian.design/components/dynamic-table"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200"
                >
                  Referencia de tablas operables
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}