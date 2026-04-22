import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Cpu, ShieldCheck } from "lucide-react";
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
    <div className="shell-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-sky-300">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-slate-500">Infraestructura</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function NodesPage() {
  return (
    <PageShell
      eyebrow="Infraestructura · Heartbeat y disponibilidad"
      title="Nodos"
      description="Todo lo conectado al ecosistema debe verse simple: quién está vivo, quién está degradado y qué necesita atención."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Inicio
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Ir a operaciones
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Qué debes leer primero">
          No empieces por el detalle técnico. Empieza por el estado: online, degradado u offline.
          Después entra al nodo específico si algo se ve raro.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <SignalCard
            title="Heartbeat"
            text="El indicador más útil no es el diseño bonito: es saber si el nodo realmente reportó vida hace poco."
            icon={Activity}
          />
          <SignalCard
            title="Rol del nodo"
            text="Cada nodo debe dejar claro si es físico, cloud, agente o servicio auxiliar. Sin eso, el mapa se vuelve confuso."
            icon={Cpu}
          />
          <SignalCard
            title="Control y seguridad"
            text="La infraestructura también debe leerse desde gobernanza: quién puede escribir, ejecutar o quedar pausado."
            icon={ShieldCheck}
          />
        </section>

        <section className="shell-panel overflow-hidden p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Mapa operativo</p>
              <h2 className="section-title">Estado en tiempo real</h2>
              <p className="section-copy">
                Vista pensada para leer rápido en móvil y profundizar en desktop sin perder
                contexto.
              </p>
            </div>

            <span className="shell-chip-success">Señal activa</span>
          </div>

          <NodesPanel />
        </section>
      </div>
    </PageShell>
  );
}