import type { Metadata } from "next";
import Link from "next/link";
import { APP_REGISTRY, AGI_REGISTRY } from "@/lib/hocker-dashboard";
import AppCard from "@/components/ui-hocker/AppCard";
import AgiCard from "@/components/ui-hocker/AgiCard";
import HockerSection from "@/components/ui-hocker/HockerSection";
import NovaCorePanel from "@/components/ui-hocker/NovaCorePanel";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

import { getHockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import HockerCommandCenter from "@/components/owner/HockerCommandCenter";
import AgiRuntimePreview from "@/components/owner/AgiRuntimePreview";
import OwnerApprovalCenter from "@/components/owner/OwnerApprovalCenter";

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

export default async function OwnerPage() {
  const livePulse = await getHockerLivePulseSummary();

  const topApps = APP_REGISTRY.filter((app) => ["hocker-one", "hocker-ads", "chido-casino"].includes(app.key));
  const topAgis = AGI_REGISTRY.filter((agi) => ["nova", "syntia", "vertx", "curvewind"].includes(agi.key));

  return (
    <div className="hko-page-flow space-y-5">
      <HockerCommandCenter summary={livePulse} />
      <AgiRuntimePreview projectId={process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"} />
      <OwnerApprovalCenter projectId={process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"} />
      <NovaCorePanel variant="owner" />
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="hko-mini-stat"><span>Acceso</span><strong>Protegido</strong></div>
        <div className="hko-mini-stat"><span>Login</span><strong>Activo</strong></div>
        <div className="hko-mini-stat"><span>Ejecución real</span><strong>Bloqueada</strong></div>
      </section>
      <HockerSection title="Entradas rápidas" text="Lo principal siempre visible. Sin buscar rutas." defaultOpen>
        <div className="grid gap-3 md:grid-cols-4">
          <Link href="/map" className="hko-module-card">
            <StatusBadge status="live" />
            <h3 className="mt-4 text-lg font-black text-white">Mapa</h3>
            <p className="mt-2 text-sm text-slate-400">Todo el ecosistema ordenado.</p>
          </Link>
          <Link href="/live" className="hko-module-card">
            <StatusBadge status="live" />
            <h3 className="mt-4 text-lg font-black text-white">Sistema en vivo</h3>
            <p className="mt-2 text-sm text-slate-400">Agente, nodo espejo y memoria IA.</p>
          </Link>
          <Link href="/chat" className="hko-module-card">
            <StatusBadge status="protected" />
            <h3 className="mt-4 text-lg font-black text-white">NOVA</h3>
            <p className="mt-2 text-sm text-slate-400">Canal central para resolver.</p>
          </Link>
          <Link href="/commands" className="hko-module-card">
            <StatusBadge status="pending" />
            <h3 className="mt-4 text-lg font-black text-white">Tareas</h3>
            <p className="mt-2 text-sm text-slate-400">Acciones claras y revisadas.</p>
          </Link>
        </div>
      </HockerSection>
      <HockerSection title="Apps principales" text="Accesos rápidos a las plataformas más importantes." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-3">{topApps.map((app) => <AppCard key={app.key} app={app} />)}</div>
      </HockerSection>
      <HockerSection title="NOVA y Tridente" text="La jerarquía central que mantiene ordenado el ecosistema." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-4">{topAgis.map((agi) => <AgiCard key={agi.key} agi={agi} featured={agi.key === "nova"} />)}</div>
      </HockerSection>
      <HockerSection title="Qué revisar ahora" text="Atajos para operar sin entrar a detalles técnicos." defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/status" className="hko-module-card"><StatusBadge status="live" /><h3 className="mt-4 text-lg font-black text-white">Estado general</h3><p className="mt-2 text-sm text-slate-400">Sistema, login, seguridad y ejecución real.</p></Link>
          <Link href="/commands" className="hko-module-card"><StatusBadge status="pending" /><h3 className="mt-4 text-lg font-black text-white">Tareas</h3><p className="mt-2 text-sm text-slate-400">Pendientes, en curso y cerradas.</p></Link>
          <Link href="/security" className="hko-module-card"><StatusBadge status="protected" /><h3 className="mt-4 text-lg font-black text-white">Seguridad</h3><p className="mt-2 text-sm text-slate-400">Rutas, permisos y protección owner.</p></Link>
        </div>
      </HockerSection>
    </div>
  );
}
