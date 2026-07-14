import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
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
import { getAgiRuntimeSummary } from "@/lib/agi-runtime-core";
import type { AgiRuntimeSummaryLike } from "@/types/agi-runtime-summary";

import NovaRealtimeChatLazy from "@/components/NovaRealtimeChatLazy";
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
  { href: "/map", icon: MapIcon, title: "Mapa", text: "Todo el ecosistema ordenado" },
  { href: "/live", icon: Activity, title: "Sistema en vivo", text: "Agente, nodos y memoria IA" },
  { href: "/agis", icon: Brain, title: "AGIs", text: "Los 8 agentes del ecosistema" },
  { href: "/apps", icon: Network, title: "Apps", text: "Plataformas conectadas" },
  { href: "/integrations", icon: Workflow, title: "Integraciones", text: "Conexiones y herramientas" },
  { href: "/security", icon: ShieldCheck, title: "Seguridad", text: "Permisos y acceso owner" },
  { href: "/memory", icon: DatabaseZap, title: "Memoria IA", text: "Contexto que aprende" },
  { href: "/status", icon: GitBranch, title: "Estado general", text: "Sistema, login y seguridad" },
];

export default async function OwnerPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";

  const [pulse, liveSummary, runtimeSummary] = await Promise.all([
    getHockerLivePulseSummary(),
    getHockerLiveSummary().catch(() => null),
    getAgiRuntimeSummary(projectId).catch(() => ({ ok: false, integrations: [], counts: {} }) as AgiRuntimeSummaryLike),
  ]);

  const liveSummaryTyped = liveSummary as Awaited<ReturnType<typeof getHockerLiveSummary>> | null;
  const runtimeTyped = runtimeSummary as AgiRuntimeSummaryLike;

  const pendingCount = (runtimeTyped.counts?.actions ?? 0);

  return (
    <div className="hko-uni-grid">
      {/* ── Hero band ─────────────────────────────────────────────── */}
      <div className="hko-uni-hero hko-uni-hero">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative grid h-9 w-9 place-items-center rounded-2xl border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_28px_rgba(30,200,255,0.18)]">
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </span>
            <h1 className="hko-uni-hero-title">Hocker ONE</h1>
          </div>
          <p className="hko-uni-hero-sub">
            Todo tu ecosistema en una sola pantalla. Habla con NOVA, revisa el estado real del sistema,
            aprueba acciones y revisa herramientas conectadas — sin cambiar de página.
          </p>
        </div>
        <div className="hko-uni-hero-pills">
          <span className="hko-uni-hero-pill is-live"><span className="dot" /> NOVA activa</span>
          <span className="hko-uni-hero-pill is-protect"><span className="dot" /> Owner Gate</span>
          <span className="hko-uni-hero-pill is-protect"><span className="dot" /> Railway · Vercel</span>
          {pendingCount > 0 && (
            <span className="hko-uni-hero-pill is-pending"><span className="dot" /> {pendingCount} por aprobar</span>
          )}
        </div>
      </div>

      {/* ── NOVA chat (embedded, full-height) ─────────────────────── */}
      <section className="hko-uni-panel hko-uni-chat hko-uni-chat">
        <div className="hko-uni-panel-head">
          <div>
            <p className="hko-uni-panel-kicker">Canal central</p>
            <p className="hko-uni-panel-title">Hablar con NOVA</p>
          </div>
          <span className="hko-status-val ok">En vivo</span>
        </div>
        <div className="hko-uni-panel-body">
          <div className="hko-uni-chat-inner">
            <NovaRealtimeChatLazy />
          </div>
        </div>
      </section>

      {/* ── Live status (right column) ────────────────────────────── */}
      <OwnerUnifiedStatus liveSummary={liveSummaryTyped} pulse={pulse} />

      {/* ── Approvals queue (right column) ────────────────────────── */}
      <OwnerUnifiedApprovals projectId={projectId} />

      {/* ── Tools / integrations (bottom) ─────────────────────────── */}
      <OwnerUnifiedTools summary={runtimeTyped} />

      {/* ── Quick access strip (bottom) ───────────────────────────── */}
      <section className="hko-uni-panel hko-uni-quick">
        <div className="hko-uni-panel-head" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: 0, paddingBottom: "0.85rem", marginBottom: "0.85rem" }}>
          <div>
            <p className="hko-uni-panel-kicker">Navegación rápida</p>
            <p className="hko-uni-panel-title">Vistas detalladas cuando las necesites</p>
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
