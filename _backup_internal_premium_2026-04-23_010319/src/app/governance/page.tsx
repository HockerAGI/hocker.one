import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, ToggleLeft } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Control",
  description: "Seguridad operativa, kill switch y permisos sensibles del sistema.",
};

function GovernanceCard({
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-rose-300">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-slate-500">Seguridad operativa</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function GovernancePage() {
  return (
    <PageShell
      eyebrow="Control · Seguridad y reglas"
      title="Gobernanza"
      description="Aquí no se diseña ni se adorna: aquí se decide qué puede ejecutarse, qué se pausa y qué requiere intervención inmediata."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Inicio
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Ver comandos
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Zona sensible" tone="rose">
          Esta vista controla escritura, ejecución y comportamiento crítico. Debe ser entendible al
          instante y difícil de usar mal.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <GovernanceCard
            title="Kill switch"
            text="Debe existir una forma clara de detener operación sensible sin depender de pasos complejos."
            icon={AlertTriangle}
          />
          <GovernanceCard
            title="Permiso de escritura"
            text="No todo lo que se puede ejecutar debería poder escribir. Separar ambas cosas reduce riesgo."
            icon={ToggleLeft}
          />
          <GovernanceCard
            title="Lectura ejecutiva"
            text="Incluso una persona no técnica debe entender si el sistema está bloqueado, abierto o en estado de revisión."
            icon={ShieldCheck}
          />
        </section>

        <section className="shell-panel overflow-hidden p-0">
          <div className="border-b border-white/5 bg-slate-950/45 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Controles principales</p>
                <h2 className="section-title mt-1">Estado crítico del sistema</h2>
              </div>

              <span className="shell-chip-danger">Alta sensibilidad</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <GovernancePanel />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
