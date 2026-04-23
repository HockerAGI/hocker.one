import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  TerminalSquare,
  Waypoints,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Operaciones",
  description: "Cola, aprobaciones y ejecución de comandos del ecosistema.",
};

function SignalCard({
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_34%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-sky-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{title}</p>
            <p className="text-xs text-slate-500">operación clara</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.035] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white sm:text-base">{value}</p>
    </div>
  );
}

export default function CommandsPage() {
  return (
    <PageShell
      eyebrow="Operaciones · Runtime y control"
      title="Comandos"
      description="Desde aquí se crea, aprueba, ejecuta y revisa cada instrucción del sistema sin perder contexto."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Dashboard
          </Link>
          <Link href="/governance" className="shell-button-primary">
            Governance
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Lectura rápida">
          Primero crea la instrucción. Después confirma si quedó en cola, en revisión o en
          ejecución. Aquí todo debe leerse fácil y sin ruido.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <SignalCard
            title="Una intención por comando"
            text="Instrucciones cortas y concretas dan mejor trazabilidad y menos errores."
            icon={TerminalSquare}
          />
          <SignalCard
            title="Aprobación cuando importa"
            text="Los cambios sensibles deben pasar por control antes de ejecutarse."
            icon={ShieldCheck}
          />
          <SignalCard
            title="Cierre visible"
            text="La tarea no termina al enviarse. Termina cuando su estado queda claro."
            icon={CheckCircle2}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="shell-panel relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%)]" />
              <div className="relative">
                <div className="mb-5 flex flex-col gap-4">
                  <div>
                    <p className="section-kicker">Nueva instrucción</p>
                    <h2 className="section-title">Crear comando</h2>
                    <p className="section-copy">
                      Define la acción, el destino y el contexto con lenguaje simple.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatPill label="flujo" value="crear" />
                    <StatPill label="control" value="validar" />
                    <StatPill label="salida" value="seguir" />
                  </div>
                </div>

                <CommandBox />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="shell-panel relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
              <div className="relative">
                <div className="mb-5 flex flex-col gap-4 border-b border-white/6 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="section-kicker">Seguimiento</p>
                    <h2 className="section-title">Cola operativa</h2>
                    <p className="section-copy">
                      Aquí se ve lo que espera aprobación, lo que corre y lo que ya cerró.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="shell-chip-brand flex items-center gap-1.5">
                      <PlayCircle className="h-3.5 w-3.5" />
                      runtime
                    </span>
                    <span className="shell-chip flex items-center gap-1.5">
                      <Waypoints className="h-3.5 w-3.5" />
                      trazable
                    </span>
                  </div>
                </div>

                <CommandsQueue />
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
