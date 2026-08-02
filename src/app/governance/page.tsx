import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, Lock, Siren } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gobierno | Hocker ONE",
  description: "Lectura y control de escritura, pausa y emergencia.",
  robots: { index: false, follow: false, noarchive: true },
};

function ControlCard({ title, text, icon: Icon }: { title: string; text: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="shell-card relative overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.08),transparent_36%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-rose-300"><Icon className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-black text-white">{title}</p>
            <p className="text-xs text-slate-500">criterio de control</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

export default function GovernancePage() {
  return (
    <PageShell
      eyebrow="Governance · lectura verificable"
      title="Guardia"
      description="Consulta el registro actual de pausa y escritura. Si la API no responde, la interfaz lo muestra como estado no verificado."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">Dashboard</Link>
          <Link href="/commands" className="shell-button-primary">Operaciones</Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Zona sensible" tone="rose">Confirma la lectura y su fecha antes de cambiar cualquier control.</Hint>

        <section className="grid gap-4 md:grid-cols-4">
          <ControlCard title="Pausa total" text="Detiene escritura y ejecución cuando el registro está habilitado." icon={Siren} />
          <ControlCard title="Escritura" text="Expone el permiso persistido; no presupone autorización permanente." icon={Lock} />
          <ControlCard title="Riesgo" text="Los cambios requieren autenticación y quedan sujetos a las reglas del backend." icon={AlertTriangle} />
          <ControlCard title="Evidencia" text="La fecha de actualización permite distinguir estado actual de información antigua." icon={ShieldCheck} />
        </section>

        <section className="hocker-panel-pro relative overflow-hidden border-rose-500/15">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]" />
          <div className="relative border-b border-white/5 bg-slate-950/40 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">Control principal</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">Estado persistido</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">Lectura dinámica del registro de gobierno para el proyecto seleccionado.</p>
              </div>
              <span className="shell-chip border-white/10 bg-white/[0.04] text-slate-300">actualización cada 30 s</span>
            </div>
          </div>
          <div className="relative p-4 sm:p-6"><GovernancePanel /></div>
        </section>
      </div>
    </PageShell>
  );
}
