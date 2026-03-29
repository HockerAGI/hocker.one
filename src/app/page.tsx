import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";
import AgisRegistry from "@/components/AgisRegistry";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Sala de Mando NOVA",
  description: "Interfaz de orquestación central de la Mente Colmena.",
};

export default function HomePage() {
  return (
    <PageShell
      title="Sala de Mando"
      subtitle="Supervisión activa de la Mente Colmena y ejecución de protocolos Omni-Sync."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 4l8 8-8 8" />
          </svg>
          Ir al Dashboard
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Hint title="Protocolo de Conciencia Activo">
            Bienvenido, Director. El Automation Fabric está operando en niveles nominales. Las sub-IAs están listas para la sincronización de objetivos 2025.
          </Hint>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/30 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
                <div className="rounded-[30px] border border-sky-400/15 bg-slate-950/80 p-5 shadow-[0_0_30px_rgba(14,165,233,0.18)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-400">
                    Logotipo completo
                  </div>
                  <div className="mt-4 flex min-h-[170px] items-center justify-center rounded-[22px] border border-white/10 bg-white/5 px-5 py-6">
                    <Image
                      src="/brand/hocker-one-logo.png"
                      alt="Logo completo de Hocker One"
                      width={360}
                      height={126}
                      className="h-16 w-auto drop-shadow-[0_0_18px_rgba(14,165,233,0.38)] sm:h-20"
                      priority
                    />
                  </div>
                </div>

                <div className="rounded-[30px] border border-blue-400/15 bg-slate-950/80 p-5 shadow-[0_0_30px_rgba(59,130,246,0.18)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-400">
                    Isotipo
                  </div>
                  <div className="mt-4 flex min-h-[170px] items-center justify-center rounded-[22px] border border-white/10 bg-white/5 px-5 py-6">
                    <Image
                      src="/brand/hocker-one-isotype.png"
                      alt="Isotipo de Hocker One"
                      width={240}
                      height={240}
                      className="h-24 w-auto drop-shadow-[0_0_18px_rgba(59,130,246,0.5)] sm:h-28"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  ["Sala activa", "Mando central + chat + estado"],
                  ["Marca visible", "Logo e isotipo con contraste real"],
                  ["Lectura limpia", "Pensado para móvil y web"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">{label}</div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">{value}</div>
                  </div>
                ))}
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-300">
                La interfaz prioriza claridad, contraste y jerarquía visual. Los accesos críticos viven arriba; la ejecución profunda se despliega abajo.
              </p>
            </div>

            <div className="border-t border-white/10 bg-gradient-to-br from-slate-950/90 to-slate-900/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-300">
                  Identidad de marca
                </div>
                <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/70 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border border-sky-400/20 bg-slate-950/90 p-2 shadow-[0_0_24px_rgba(14,165,233,0.2)]">
                      <Image
                        src="/brand/hocker-one-isotype.png"
                        alt="Isotipo de Hocker One"
                        width={96}
                        height={96}
                        className="h-full w-full object-contain drop-shadow-[0_0_16px_rgba(59,130,246,0.45)]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                        Firma visual
                      </div>
                      <div className="mt-1 text-base font-black tracking-tight text-white">Hocker One</div>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Azul frío, blanco limpio y fondo oscuro para que la marca se lea sin esfuerzo.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-[20px] border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-300">
                  Las piezas de marca quedan arriba del pliegue para que la identidad se vea primero en móvil y escritorio, sin perder legibilidad.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="hocker-card p-1 shadow-blue-500/5">
              <NovaChat />
            </div>
          </div>

          <aside className="flex flex-col gap-8 xl:col-span-4 animate-in fade-in slide-in-from-right duration-700">
            <SystemStatus />
            <AgisRegistry title="Células Operativas" />
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 border-t border-white/5 pt-8 mt-4">
          <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex flex-col gap-4">
              <h3 className="px-2 text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Cola de Ejecución en Tiempo Real
              </h3>
              <CommandsQueue />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}