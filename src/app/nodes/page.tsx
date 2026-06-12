import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Cpu, ShieldCheck, Radar } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Nodos",
  description: "Estado operativo, heartbeat y lectura clara de infraestructura.",
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
            <p className="text-xs text-slate-500">infraestructura viva</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

export default function NodesPage() {
  return (
    <PageShell
      eyebrow="Infraestructura · Heartbeat y mapa vivo"
      title="Nodos"
      description="Vista simple para saber qué está online, qué está degradado y qué necesita atención sin perder tiempo."
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
        <Hint title="Qué leer primero">
          Antes del detalle técnico, revisa la señal. Después entra al nodo específico si ves
          algo raro.
        </Hint>

        <section className="grid gap-4 md:grid-cols-4">
          <SignalCard
            title="Heartbeat"
            text="Si no reporta vida reciente, el nodo necesita atención."
            icon={Activity}
          />
          <SignalCard
            title="Rol"
            text="Debe quedar claro si es cloud, físico, agente o auxiliar."
            icon={Cpu}
          />
          <SignalCard
            title="Ruta"
            text="El mapa debe dejar ver por dónde corre la operación real."
            icon={Radar}
          />
          <SignalCard
            title="Seguridad"
            text="Toda lectura de estado también se cruza con control y permisos."
            icon={ShieldCheck}
          />
        </section>

        <section className="shell-panel relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
          <div className="relative">
            <div className="mb-5 flex flex-col gap-4 border-b border-white/6 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Mapa operativo</p>
                <h2 className="section-title">Señal en tiempo real</h2>
                <p className="section-copy">
                  Diseñado para leerse rápido en móvil y escalar bien en pantalla grande.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="shell-chip-success">señal activa</span>
                <span className="shell-chip">lectura rápida</span>
              </div>
            </div>

            <NodesPanel />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
