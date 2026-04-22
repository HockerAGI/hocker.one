import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, TerminalSquare } from "lucide-react";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Operaciones",
  description: "Cola, aprobaciones y ejecución de comandos del ecosistema.",
};

function QuickTip({
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
          <p className="text-xs text-slate-500">Operación clara</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function CommandsPage() {
  return (
    <PageShell
      eyebrow="Operaciones · Cola y aprobaciones"
      title="Comandos y ejecución"
      description="Aquí se crean tareas, se revisan aprobaciones y se sigue el estado real de cada instrucción del sistema."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Volver al inicio
          </Link>
          <Link href="/governance" className="shell-button-primary">
            Ver control
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Cómo usar esta vista">
          Primero escribe una instrucción simple y concreta. Después valida en la cola si quedó en
          revisión, ejecución o cierre. Aquí no se trata de “mandar mucho”, sino de “mandar bien”.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <QuickTip
            title="Una tarea por comando"
            text="Evita mezclar varias acciones en una sola instrucción. Eso reduce errores y hace más clara la trazabilidad."
            icon={TerminalSquare}
          />
          <QuickTip
            title="Aprobación cuando importa"
            text="Los cambios sensibles deben pasar por revisión antes de ejecutarse. El panel ya soporta ese flujo."
            icon={ShieldCheck}
          />
          <QuickTip
            title="Cierre visible"
            text="Un comando bueno no solo se envía: también debe terminar con estado claro, resultado y tiempo de ejecución."
            icon={CheckCircle2}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="shell-panel p-5">
              <div className="mb-4">
                <p className="section-kicker">Nueva instrucción</p>
                <h2 className="section-title">Crear comando</h2>
                <p className="section-copy">
                  Usa lenguaje simple. Define el nodo cuando aplique y evita ambigüedad en el
                  payload.
                </p>
              </div>

              <CommandBox />
            </div>
          </div>

          <div className="space-y-4">
            <div className="shell-panel p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-kicker">Seguimiento</p>
                  <h2 className="section-title">Cola operativa</h2>
                  <p className="section-copy">
                    Aquí se concentra lo que requiere aprobación, lo que está corriendo y lo que ya
                    terminó.
                  </p>
                </div>

                <span className="shell-chip-brand">Runtime real</span>
              </div>

              <CommandsQueue />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}