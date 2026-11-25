import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Brain, Network, ShieldCheck, Workflow } from "lucide-react";
import "@/styles/owner-unified.css";
import { getOwnerHomeEvidence } from "@/lib/owner-home-evidence";
import { getVerifiedAgiRuntimeSummary } from "@/lib/verified-agi-runtime";
import OwnerUnifiedStatus, { OwnerHomeActivity } from "@/components/owner/OwnerUnifiedStatus";
import OwnerProviderMirror from "@/components/owner/OwnerProviderMirror";
import OwnerUnifiedApprovals from "@/components/owner/OwnerUnifiedApprovals";
import OwnerUnifiedTools from "@/components/owner/OwnerUnifiedTools";
import RefreshDataButton from "@/components/RefreshDataButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Inicio | Hocker ONE", description: "Centro privado de control del ecosistema HOCKER.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};
const QUICK_LINKS = [
  { href: "/owner/context-bridge", icon: Network, title: "Continuidad", text: "Fuentes y contexto" },
  { href: "/agis", icon: Brain, title: "AGIs", text: "Perfiles y capacidades" },
  { href: "/apps", icon: Workflow, title: "Aplicaciones", text: "Productos del ecosistema" },
  { href: "/integrations", icon: ShieldCheck, title: "Conexiones", text: "Servicios y permisos" },
];

export default async function OwnerPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
  const evidence = await getOwnerHomeEvidence(projectId);
  const runtime = await getVerifiedAgiRuntimeSummary(projectId, { allowProtectedReads: evidence.protectedReads });
  const novaService = runtime.service_status.nova;
  const pendingCount = evidence.pendingCount;
  const preview = evidence.environment === "preview";
  return (
    <div className="hko-uni-grid hko-home-compact">
      <header className="hko-uni-hero">
        <div>
          <h1 className="hko-uni-hero-title">Inicio</h1>
          <p className="hko-uni-hero-sub">Tu operación en un solo lugar.</p>
        </div>
        <div className="hko-uni-hero-pills">
          <span className="hko-uni-hero-pill is-protect">{preview ? "Preview" : evidence.environment === "production" ? "Producción" : "Entorno sin confirmar"}</span>
          {evidence.ownerRole ? <Link href="/auth/mfa?returnTo=%2Fowner" className="hko-uni-hero-pill is-protect">{evidence.ownerMfa === true ? "MFA verificado" : evidence.ownerMfa === false ? "Verificar MFA" : "MFA sin comprobar"}</Link> : null}
          <RefreshDataButton />
        </div>
        {preview ? <p className="w-full rounded-xl border border-sky-300/20 bg-sky-300/5 px-3 py-2 text-sm text-slate-200">Vista de evaluación. Los datos de sesión son reales; las comprobaciones protegidas se realizan en <a className="font-semibold text-sky-200 underline" href="https://hockerone.vercel.app/owner">Producción</a>.</p> : null}
      </header>
      <div className="hko-home-work">
        <section className="hko-uni-panel hko-uni-chat" aria-labelledby="nova-entry-title">
          <div className="hko-uni-panel-head">
            <h2 className="hko-uni-panel-title" id="nova-entry-title">NOVA</h2>
            <span className="hko-status-val info">Asistente</span>
          </div>
          <div className="hko-uni-panel-body">
            <Link href="/chat" className="group flex flex-col gap-4 rounded-xl border border-sky-300/20 bg-sky-300/[0.04] p-4 transition hover:border-sky-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70">
              <div><h3 className="text-xl font-semibold text-white">Habla con NOVA</h3><p className="mt-1 text-sm leading-6 text-slate-300">Consulta, prepara cambios y revisa acciones.</p></div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">Abrir NOVA <ArrowUpRight className="h-4 w-4" /></span>
            </Link>
            <p className="mt-3 text-sm text-slate-300">Motor dedicado: {novaService.status === "online" ? "Responde" : novaService.status === "offline" ? "Sin respuesta" : "Sin verificar"}. El chat tiene su propia ruta de inferencia.</p>
          </div>
        </section>
        <OwnerUnifiedApprovals projectId={projectId} enabled={evidence.protectedReads} preview={preview} initialPendingCount={pendingCount} />
      </div>
      <OwnerProviderMirror preview={preview} supabase={{
        verified: evidence.nodeCount !== null || evidence.agiCount !== null,
        agiCount: evidence.agiCount, nodeCount: evidence.nodeCount, checkedAt: evidence.checkedAt,
      }} />
      <div className="hko-home-operation"><OwnerUnifiedStatus evidence={evidence} novaService={novaService} /><OwnerHomeActivity evidence={evidence} /></div>
      <OwnerUnifiedTools summary={runtime} preview={preview} />
      <section className="hko-uni-panel hko-uni-quick">
        <div className="hko-uni-panel-head"><h2 className="hko-uni-panel-title">Accesos rápidos</h2></div>
        <div className="hko-uni-quick-grid">
          {QUICK_LINKS.map(link => <Link key={link.href} href={link.href} className="hko-uni-quick-card">
            <span className="hko-uni-quick-card-icon"><link.icon className="h-4 w-4" /></span>
            <span className="hko-uni-quick-card-title">{link.title}</span><span className="hko-uni-quick-card-text">{link.text}</span>
          </Link>)}
        </div>
      </section>
    </div>
  );
}
