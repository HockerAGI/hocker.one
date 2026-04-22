import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Centro de control claro, premium y entendible del ecosistema Hocker.",
};

function LandingCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="shell-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-sky-300">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="text-xs text-slate-500">Módulo principal</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="shell-panel-strong surface-grid overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandMark hero className="w-fit" />

            <div className="flex flex-wrap gap-2">
              <Link href="/login" className="shell-button-secondary">
                Entrar
              </Link>
              <Link href="/dashboard" className="shell-button-primary">
                Abrir panel
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="section-kicker">Hocker ONE · Control plane</p>
              <h1 className="h1-title mt-4">
                Un centro de control entendible, claro y listo para operar en móvil y web.
              </h1>
              <p className="section-copy max-w-3xl">
                Hocker ONE unifica asistencia, nodos, aprobaciones, auditoría y módulos conectados
                en una experiencia que no exige saber del sistema para entender lo importante.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="shell-chip-brand">NOVA</span>
                <span className="shell-chip">Operaciones</span>
                <span className="shell-chip">Nodos</span>
                <span className="shell-chip">Auditoría</span>
                <span className="shell-chip">Supply</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="shell-card px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Qué ves primero
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Estado general del ecosistema</p>
              </div>

              <div className="shell-card px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Qué haces rápido
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Abrir NOVA, revisar nodos, aprobar comandos</p>
              </div>

              <div className="shell-card px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Qué no hacemos
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Ruido visual ni panel técnico confuso</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LandingCard
          title="Inicio"
          text="Lectura ejecutiva del ecosistema con estados, alertas y acciones rápidas."
          icon={LayoutDashboard}
        />
        <LandingCard
          title="NOVA"
          text="Asistencia operativa con memoria, contexto y sugerencias accionables."
          icon={Bot}
        />
        <LandingCard
          title="Operaciones"
          text="Cola de comandos, aprobaciones y ejecución clara para cualquier usuario."
          icon={TerminalSquare}
        />
        <LandingCard
          title="Nodos y control"
          text="Infraestructura, heartbeat, seguridad y trazabilidad del sistema."
          icon={Cpu}
        />
      </section>

      <section className="shell-panel p-6">
        <p className="section-kicker">Dirección del producto</p>
        <h2 className="section-title">El diseño base no lleva imágenes de NOVA</h2>
        <p className="section-copy max-w-3xl">
          La identidad de NOVA queda reservada para un módulo o avatar real dentro de la app. La
          interfaz general se mantiene limpia, premium y orientada a claridad operativa.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard" className="shell-button-primary">
            Ir al dashboard
          </Link>
          <Link href="/governance" className="shell-button-secondary">
            <ShieldCheck className="h-4 w-4" />
            Ver control
          </Link>
        </div>
      </section>
    </main>
  );
}