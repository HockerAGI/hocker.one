"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import { LiveOperationsCenter } from "@/components/dashboard/LiveOperationsCenter";
import type { DashboardSummary, AppRegistryItem, AgiRegistryItem, DashboardCommandItem } from "@/lib/hocker-dashboard";
import { getStatusLabel, getStatusTone } from "@/lib/hocker-dashboard";
import { externalStatusLabel, externalStatusTone } from "@/lib/external-services";

type Props = {
  summary: DashboardSummary;
  className?: string;
};

function Badge({ status }: { status: string }) {
  return <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(status)].join(" ")}>{getStatusLabel(status)}</span>;
}

function LogoTile({ src, title }: { src?: string; title: string }) {
  return <div className="hko-logo-tile h-12 w-12 shrink-0">{src ? <img src={src} alt="" className="h-10 w-10 object-contain" /> : <span className="text-xs font-black text-cyan-200">{title.slice(0, 2).toUpperCase()}</span>}</div>;
}

function ModuleCard({ item }: { item: AppRegistryItem | AgiRegistryItem }) {
  return (
    <Link href={item.href} className="rounded-[24px] border border-white/10 bg-[#0b1526] p-4 transition hover:border-cyan-400/25 hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <LogoTile src={item.logoSrc} title={item.title} />
        <Badge status={item.status} />
      </div>
      <h3 className="mt-4 text-base font-black text-white">{item.title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-400">{item.subtitle}</p>
    </Link>
  );
}

function CommandPreview({ item }: { item: DashboardCommandItem }) {
  const label = item.command.includes("github") ? "Actualización de código" : item.command.includes("supply") ? "Tarea de tienda" : "Tarea del sistema";
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{label}</h3>
          <p className="mt-1 text-sm text-slate-400">{item.projectId}</p>
        </div>
        <Badge status={item.status} />
      </div>
      <details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Detalles técnicos</summary>
        <p className="mt-2 break-all text-xs text-slate-500">{item.command}</p>
      </details>
    </article>
  );
}

export default function DashboardClient({ summary, className }: Props) {
  const activeApps = summary.apps.filter((item) => item.status === "live" || item.status === "ready").length;
  const protectedItems = [...summary.apps, ...summary.agis].filter((item) => item.status === "protected").length;
  const pendingTasks = summary.recentCommands.filter((item) => item.status === "queued" || item.status === "needs_approval" || item.status === "running").length;

  return (
    <PageShell
      className={className}
      eyebrow="Hocker ONE"
      title="Resumen"
      description="Vista clara del ecosistema: apps, AGIs, seguridad, tareas y estado general."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/apps" className="hocker-button-ghost">Apps</Link>
          <Link href="/agis" className="hocker-button-ghost">AGIs</Link>
          <Link href="/status" className="hocker-button-primary">Estado</Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="hocker-panel-pro p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Apps activas</p><p className="mt-3 text-4xl font-black text-white">{activeApps}</p><p className="mt-2 text-sm text-slate-400">Módulos listos o en integración.</p></div>
          <div className="hocker-panel-pro p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Protección</p><p className="mt-3 text-4xl font-black text-white">{protectedItems}</p><p className="mt-2 text-sm text-slate-400">Áreas sensibles bajo control.</p></div>
          <div className="hocker-panel-pro p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tareas</p><p className="mt-3 text-4xl font-black text-white">{pendingTasks}</p><p className="mt-2 text-sm text-slate-400">Pendientes o en revisión.</p></div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <details open className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Apps</p><h2 className="mt-2 text-xl font-black text-white">Módulos principales</h2></summary>
            <div className="grid gap-4 p-5 md:grid-cols-2">{summary.apps.slice(0, 6).map((item) => <ModuleCard key={item.key} item={item} />)}</div>
          </details>

          <details open className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">AGIs</p><h2 className="mt-2 text-xl font-black text-white">Núcleo inteligente</h2></summary>
            <div className="grid gap-4 p-5 md:grid-cols-2">{summary.agis.slice(0, 6).map((item) => <ModuleCard key={item.key} item={item} />)}</div>
          </details>
        </section>

        <LiveOperationsCenter />

        <section className="grid gap-4 xl:grid-cols-2">
          <details className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Servicios</p><h2 className="mt-2 text-xl font-black text-white">Conexiones externas</h2></summary>
            <div className="grid gap-3 p-5">
              {summary.services.map((service) => (
                <article key={service.key} className="rounded-[22px] border border-white/10 bg-[#0b1526] p-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{service.title}</h3><p className="mt-1 text-sm text-slate-400">{service.subtitle}</p></div><span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", externalStatusTone(service.status)].join(" ")}>{externalStatusLabel(service.status)}</span></div>
                  <details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Detalles técnicos</summary><p className="mt-2 break-all text-xs text-slate-500">{service.endpoint}</p></details>
                </article>
              ))}
            </div>
          </details>

          <details className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Tareas recientes</p><h2 className="mt-2 text-xl font-black text-white">Seguimiento</h2></summary>
            <div className="grid gap-3 p-5">{summary.recentCommands.slice(0, 6).map((item) => <CommandPreview key={item.id} item={item} />)}</div>
          </details>
        </section>
      </div>
    </PageShell>
  );
}
