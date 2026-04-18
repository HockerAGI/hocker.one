import type { Metadata } from "next";
import BrandMark from "@/components/BrandMark";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada Hocker ONE",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:80px_80px] opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,6,23,0.55)_100%)]" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-10 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div className="flex flex-col gap-6 hocker-page-enter">
            <BrandMark hero className="w-fit" />

            <div className="max-w-2xl">
              <p className="hocker-title-line">Hocker ONE · Control Panel</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Un solo acceso.
                <span className="block text-sky-300 hocker-text-glow">
                  Una sola NOVA.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Entra al espacio donde conversas con NOVA, revisas tareas, operas nodos y mantienes la vista completa del ecosistema.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="hocker-panel-pro px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Seguridad
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Acceso privado</p>
              </div>
              <div className="hocker-panel-pro px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Experiencia
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Web · PWA</p>
              </div>
              <div className="hocker-panel-pro px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Núcleo
                </p>
                <p className="mt-2 text-sm font-semibold text-white">NOVA activa</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="hocker-panel-pro px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
                  Chat
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Haz preguntas, sube archivos y recibe respuestas rápidas o profundas.
                </p>
              </div>
              <div className="hocker-panel-pro px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
                  Operación
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Ve tareas, nodos, tienda y seguridad en una sola interfaz.
                </p>
              </div>
            </div>
          </div>

          <div className="relative xl:justify-self-end">
            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-sky-400/10 via-transparent to-violet-500/10 blur-2xl" />
            <AuthBox className="relative z-10" />
          </div>
        </div>
      </section>
    </main>
  );
}