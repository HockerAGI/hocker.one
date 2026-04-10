import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Brain,
  Cpu,
  Sparkles,
  Waves,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import NovaAvatarHero from "@/components/NovaAvatarHero";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Centro de control de NOVA y del ecosistema Hocker ONE.",
};

function FeatureCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="hocker-card-float border border-white/5 p-5 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Icon className="h-5 w-5 text-sky-300" />
        </div>
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Core
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <section className="nova-hero-shell relative overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandMark hero className="w-fit" />

            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="hocker-button-ghost"
              >
                Entrar
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="hocker-button-brand"
              >
                Ir al core
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <p className="hocker-title-line">Hocker ONE · NOVA · Control Plane</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Un solo centro.
                  <span className="block text-sky-300 hocker-text-glow">
                    Una sola NOVA.
                    <span className="block text-white">Todo en tiempo real.</span>
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Hocker ONE es la consola viva del ecosistema: visual, orquestación,
                  ejecución y telemetría en una experiencia lista para web, PWA, APK y
                  Play Store.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/chat" className="hocker-button-brand">
                  Abrir NOVA
                  <Sparkles className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="hocker-button-ghost">
                  Ver control
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/nodes" className="hocker-button-ghost">
                  Nodos vivos
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    NOVA
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">IA madre única</p>
                </div>
                <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    Runtime
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">Realtime vivo</p>
                </div>
                <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                    Plataformas
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">Web · PWA · APK</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FeatureCard
                  title="Control"
                  text="Panel vivo para operar el ecosistema desde una sola vista."
                  icon={ShieldCheck}
                />
                <FeatureCard
                  title="Brain"
                  text="NOVA dirige decisiones, estados y contexto visual."
                  icon={Brain}
                />
                <FeatureCard
                  title="Infra"
                  text="Nodos, comandos y eventos sincronizados al instante."
                  icon={Cpu}
                />
              </div>
            </div>

            <NovaAvatarHero />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="hocker-card-float border border-white/5 p-5 sm:p-6">
          <p className="hocker-title-line">Experiencia</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Cinemática, limpia y con carácter
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            La interfaz combina vidrio, profundidad, brillo controlado y una narrativa
            visual fuerte para sentirse premium en desktop y natural en celular.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-3">
                <Waves className="h-5 w-5 text-sky-300" />
                <p className="text-sm font-black text-white">Flujo continuo</p>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                El sistema entra y responde sin sensación de corte.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-sky-300" />
                <p className="text-sm font-black text-white">Marca viva</p>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                NOVA se presenta como la única avatar oficial y central del sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="hocker-panel-pro border border-sky-400/10 p-5 sm:p-6">
          <p className="hocker-title-line">Acceso rápido</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Entradas principales
          </h2>

          <div className="mt-5 grid gap-3">
            <Link
              href="/dashboard"
              className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-sky-400/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Dashboard</p>
                  <p className="mt-1 text-sm text-slate-400">Control center en vivo</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-sky-300" />
              </div>
            </Link>

            <Link
              href="/chat"
              className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-sky-400/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">NOVA</p>
                  <p className="mt-1 text-sm text-slate-400">Conversación, voz y control</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-sky-300" />
              </div>
            </Link>

            <Link
              href="/commands"
              className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-sky-400/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Comandos</p>
                  <p className="mt-1 text-sm text-slate-400">Ejecución y aprobaciones</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-sky-300" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
