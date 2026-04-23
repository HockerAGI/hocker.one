import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Brain,
  Command,
  ShieldCheck,
  Waypoints,
  MessageSquareText,
  Boxes,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Panel maestro de control del ecosistema Hocker.",
};

type EntryCardProps = {
  href: string;
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
};

function EntryCard({ href, title, text, icon: Icon }: EntryCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[28px] border border-white/6 bg-white/[0.035] p-5 shadow-[0_22px_80px_rgba(2,6,23,0.28)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/18 hover:bg-white/[0.05]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.07),transparent_30%)] opacity-90" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">
          <Icon className="h-5 w-5 text-sky-300" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
            <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-sky-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.035] px-4 py-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-white sm:text-lg">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_88%_14%,rgba(168,85,247,0.12),transparent_20%),radial-gradient(circle_at_50%_78%,rgba(14,165,233,0.10),transparent_22%),linear-gradient(180deg,#020617_0%,#040b18_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[240px] bg-[linear-gradient(180deg,rgba(56,189,248,0.12),transparent)] blur-3xl" />
      <div className="pointer-events-none absolute left-[8%] top-[12%] -z-10 h-40 w-40 rounded-full bg-sky-400/12 blur-3xl animate-[hocker-pulse_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[8%] top-[16%] -z-10 h-44 w-44 rounded-full bg-fuchsia-400/10 blur-3xl animate-[hocker-pulse_8.5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-[10%] left-1/2 -z-10 h-44 w-72 -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl animate-[hocker-pulse_9s_ease-in-out_infinite]" />

      <section className="relative overflow-hidden rounded-[40px] border border-white/6 bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(2,6,23,0.32)] backdrop-blur-3xl sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/18 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
              <Activity className="h-3.5 w-3.5" />
              Hocker ONE · Control Plane
            </div>

            <div className="max-w-4xl">
              <div className="relative w-full max-w-[360px] sm:max-w-[420px]">
                <Image
                  src="/brand/hocker-one-logo.png"
                  alt="Hocker ONE"
                  width={1200}
                  height={320}
                  priority
                  className="h-auto w-full object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.16)]"
                />
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Panel maestro.
                <span className="block text-sky-300 [text-shadow:0_0_24px_rgba(56,189,248,0.18)]">
                  Claro, rápido y vivo.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Todo el ecosistema en una sola entrada: conversación, comandos,
                nodos, seguridad y operación diaria sin ruido visual.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="hocker-button-brand">
                Abrir panel
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link href="/login" className="hocker-button-ghost">
                Iniciar sesión
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatusTile label="NOVA" value="Control único" hint="Mismo núcleo, misma lógica" />
              <StatusTile label="Runtime" value="En vivo" hint="Eventos y comandos al instante" />
              <StatusTile label="Formato" value="Web + PWA" hint="Base lista para movilidad" />
              <StatusTile label="UX" value="Mobile first" hint="Lectura limpia en celular" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-white/6 bg-slate-950/60 p-5 shadow-[0_24px_100px_rgba(2,6,23,0.34)] backdrop-blur-3xl sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
                    Entrada directa
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    Núcleos principales
                  </h2>
                </div>

                <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                  operativo
                </div>
              </div>

              <div className="grid gap-3">
                <EntryCard
                  href="/dashboard"
                  title="Dashboard"
                  text="Vista central del sistema, estado general y prioridades."
                  icon={Boxes}
                />
                <EntryCard
                  href="/chat"
                  title="Chat"
                  text="Conversación directa con NOVA para control y respuesta."
                  icon={MessageSquareText}
                />
                <EntryCard
                  href="/commands"
                  title="Comandos"
                  text="Ejecución, aprobaciones y seguimiento de acciones."
                  icon={Command}
                />
                <EntryCard
                  href="/nodes"
                  title="Nodos"
                  text="Estado de nodos físicos y cloud desde una sola vista."
                  icon={Waypoints}
                />
                <EntryCard
                  href="/governance"
                  title="Governance"
                  text="Killswitch, control y reglas críticas del sistema."
                  icon={ShieldCheck}
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-white/6 bg-white/[0.035] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                    <Brain className="h-5 w-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">NOVA permanece en el núcleo</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Sin usar su imagen como pieza principal del diseño.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
