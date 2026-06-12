import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, Lock, Siren } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Guardia",
  description: "Control de escritura y emergencia.",
};

function ControlCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="shell-card relative overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.08),transparent_36%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-rose-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{title}</p>
            <p className="text-xs text-slate-500">control crítico</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function GovernancePage() {
  return (
    <PageShell
      eyebrow="Governance · Bloqueo y control"
      title="Guardia"
      description="Este espacio concentra el estado crítico del sistema. Lo importante debe verse claro y sin fricción."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Dashboard
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Operaciones
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Zona sensible" tone="rose">
          Aquí no se improvisa. Primero se confirma el estado. Después se actúa.
        </Hint>

        <section className="grid gap-4 md:grid-cols-4">
          <ControlCard
            title="Killswitch"
            text="Cuando se activa, la prioridad cambia a contención."
            icon={Siren}
          />
          <ControlCard
            title="Escritura"
            text="No todo debe poder escribir. El permiso importa."
            icon={Lock}
          />
          <ControlCard
            title="Riesgo"
            text="La interfaz debe dejar claro cuándo algo ya es crítico."
            icon={AlertTriangle}
          />
          <ControlCard
            title="Protección"
            text="El control debe sentirse firme y entendible a la vez."
            icon={ShieldCheck}
          />
        </section>

        <section className="hocker-panel-pro relative overflow-hidden border-rose-500/15">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06),transparent_28%)]" />

          <div className="relative border-b border-white/5 bg-slate-950/40 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
                  Control principal
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                  Estado crítico
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Vista para leer permisos, bloqueo y capacidad de escritura sin perder
                  contexto del sistema.
                </p>
              </div>

              <span className="shell-chip border-rose-500/20 bg-rose-500/10 text-rose-200">
                control activo
              </span>
            </div>
          </div>

          <div className="relative p-4 sm:p-6">
            <GovernancePanel />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
