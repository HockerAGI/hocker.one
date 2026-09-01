import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Brain,
  DatabaseZap,
  GitBranch,
  Map as MapIcon,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import "@/styles/owner-unified.css";

import { getHockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { getHockerLiveSummary } from "@/lib/hocker-live-summary";
import { getHockerOperationalSnapshot } from "@/lib/hocker-operational-state";
import type { AgiRuntimeSummaryLike } from "@/types/agi-runtime-summary";

import OwnerUnifiedStatus from "@/components/owner/OwnerUnifiedStatus";
import OwnerUnifiedApprovals from "@/components/owner/OwnerUnifiedApprovals";
import OwnerUnifiedTools from "@/components/owner/OwnerUnifiedTools";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inicio | Hocker ONE",
  description: "Centro privado de control del ecosistema HOCKER.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

const QUICK_LINKS = [
  { href: "/map", icon: MapIcon, title: "Mapa", text: "Dependencias y estado operativo" },
  { href: "/live", icon: Activity, title: "Sistema en vivo", text: "Nodos, señales y actividad" },
  { href: "/agis", icon: Brain, title: "AGIs", text: "Perfiles y workers verificables" },
  { href: "/apps", icon: Network, title: "Aplicaciones", text: "Existencia, señal y evidencia" },
  { href: "/integrations", icon: Workflow, title: "Integraciones", text: "Configuradas frente a verificadas" },
  { href: "/security", icon: ShieldCheck, title: "Seguridad", text: "Permisos y acceso owner" },
  { href: "/memory", icon: DatabaseZap, title: "Memoria IA", text: "Registros y última actividad" },
  { href: "/status", icon: GitBranch, title: "Estado general", text: "Servicios y controles" },
];

function novaLabel(status: string): string {
  if (status === "online") return "NOVA verificada";
  if (status === "offline") return "NOVA sin señal";
  if (status === "configured") return "NOVA configurada";
  return "NOVA sin verificar";
}

export default async function OwnerPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";

  const [pulse, liveSummary, operational] = await Promise.all([
    getHockerLivePulseSummary(),
    getHockerLiveSummary().catch(() => null),
    getHockerOperationalSnapshot(projectId),
  ]);

  const liveSummaryTyped = liveSummary as Awaited<ReturnType<typeof getHockerLiveSummary>> | null;
  const runtimeTyped = operational.runtime as AgiRuntimeSummaryLike;
  const novaService = operational.runtime.service_status.nova;
  const pendingCount = operational.metrics.pending_actions;
  const novaIsOnline = novaService.status === "online";

  return (
    <div className="hko-uni-grid">
      <div className="hko-uni-hero">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative grid h-9 w-9 place-items-center rounded-2xl border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_28px_rgba(30,200,255,0.18)]">
              <Sparkles className="h-5 w-5" />
              <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 ${novaIsOnline ? "bg-emerald-400" : novaService.status === "offline" ? "bg-rose-400" : "bg-amber-400"}`} />
            </span>
            <h1 className="hko-uni-hero-title">Hocker ONE</h1>
          </div>
          <p className="hko-uni-hero-sub">
            Centro privado de control. Cada estado distingue configuración, señal reciente y evidencia operativa.
          </p>
        </div>
        <div className="hko-uni-hero-pills">
          <span className={`hko-uni-hero-pill ${novaIsOnline ? "is-live" : novaService.status === "offline" ? "is-pending" : "is-protect"}`}>
            <span className="dot" /> {novaLabel(novaService.status)}
          </span>
          <span className="hko-uni-hero-pill is-protect"><span className="dot" /> Owner Gate</span>
          <span className="hko-uni-hero-pill is-protect"><span className="dot" /> {operational.metrics.verified_services} servicios verificados</span>
          {pendingCount > 0 ? (
            <span className="hko-uni-hero-pill is-pending"><span className="dot" /> {pendingCount} por revisar</span>
          ) : null}
        </div>
      </div>

      <section className="hko-uni-panel hko-uni-chat" aria-labelledby="nova-entry-title">
        <div className="hko-uni-panel-head">
          <div>
            <p className="hko-uni-panel-kicker">Workspace central</p>
            <p className="hko-uni-panel-title" id="nova-entry-title">NOVA</p>
          </div>
          <span className={`hko-status-val ${novaIsOnline ? "ok" : novaService.status === "offline" ? "err" : "warn"}`}>
            {novaIsOnline ? "Conectada" : novaService.status === "offline" ? "Sin señal" : "Sin verificar"}
          </span>
        </div>
        <div className="hko-uni-panel-body">
          <Link
            href="/chat"
            className="group flex min-h-[180px] flex-col justify-between rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-6 transition hover:border-sky-300/35 hover:bg-sky-300/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200/80">Abrir workspace</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Habla con NOVA</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Conversación inmersiva, capacidades, herramientas y acciones aprobadas viven en un solo canal.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-400">
                {pendingCount > 0 ? `${pendingCount} acción${pendingCount === 1 ? "" : "es"} por revisar` : "Sin acciones pendientes"}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-black text-sky-200 transition-transform group-hover:translate-x-0.5">
                Entrar <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <OwnerUnifiedStatus liveSummary={liveSummaryTyped} pulse={pulse} novaService={novaService} checkedAt={operational.checked_at} />
      <OwnerUnifiedApprovals projectId={projectId} />
      <OwnerUnifiedTools summary={runtimeTyped} />

      <section className="hko-uni-panel hko-uni-quick">
        <div className="hko-uni-panel-head" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: 0, paddingBottom: "0.85rem", marginBottom: "0.85rem" }}>
          <div>
            <p className="hko-uni-panel-kicker">Navegación rápida</p>
            <p className="hko-uni-panel-title">Vistas de control y evidencia</p>
          </div>
        </div>
        <div className="hko-uni-quick-grid">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hko-uni-quick-card">
              <div className="hko-uni-quick-card-head">
                <span className="hko-uni-quick-card-icon">
                  <link.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="hko-uni-quick-card-title">{link.title}</div>
              <div className="hko-uni-quick-card-text">{link.text}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
