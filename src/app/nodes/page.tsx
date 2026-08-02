import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Cpu, ShieldCheck, Radar } from "lucide-react";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import NodesPanel from "@/components/NodesPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Nodos",
  description: "Heartbeat, última señal y estado verificable de infraestructura.",
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
            <p className="text-xs text-slate-500">criterio de lectura</p>
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
      eyebrow="Infraestructura · heartbeat verificable"
      title="Nodos"
      description="El estado conectado se calcula por la fecha de la última señal; no por el valor guardado en el catálogo."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">Dashboard</Link>
          <Link href="/commands" className="shell-button-primary">Operaciones</Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Qué leer primero">
          Revisa la última señal. Un nodo registrado sin heartbeat reciente se muestra como “Sin señal reciente”.
        </Hint>

        <section className="grid gap-4 md:grid-cols-4">
          <SignalCard title="Heartbeat" text="Se considera reciente durante cinco minutos desde el último reporte." icon={Activity} />
          <SignalCard title="Rol" text="Distingue cloud, físico, agente o auxiliar sin asumir actividad." icon={Cpu} />
          <SignalCard title="Ruta" text="Permite identificar por dónde debería ejecutarse la operación." icon={Radar} />
          <SignalCard title="Seguridad" text="La señal no reemplaza permisos, Owner Gate ni controles de ejecución." icon={ShieldCheck} />
        </section>

        <section className="shell-panel relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
          <div className="relative">
            <div className="mb-5 flex flex-col gap-4 border-b border-white/6 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Inventario operativo</p>
                <h2 className="section-title">Señales registradas</h2>
                <p className="section-copy">Actualización automática cada 30 segundos y mediante eventos de Supabase Realtime.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="shell-chip">umbral: 5 minutos</span>
                <span className="shell-chip">fuente: Supabase</span>
              </div>
            </div>

            <NodesPanel />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
