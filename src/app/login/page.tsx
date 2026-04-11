import type { Metadata } from "next";
import BrandMark from "@/components/BrandMark";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada Hocker ONE",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-hocker-aurora" />
      <div className="absolute inset-0 animate-[hocker-pulse_6s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_60%)] opacity-30" />
      <div className="absolute inset-0 hocker-grid-soft opacity-30" />

      <section className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="flex flex-col gap-6">
            <BrandMark hero className="w-fit" />

            <div className="max-w-2xl">
              <p className="hocker-title-line">Hocker ONE · Control Plane</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Un solo acceso.
                <span className="block text-sky-300 hocker-text-glow">
                  Una sola NOVA.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Entrar aquí es pasar directo al núcleo operativo del ecosistema:
                chat, comandos, nodos, supply y gobernanza en una sola matriz.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Seguridad
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Supabase Auth</p>
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
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-sky-400/10 to-purple-500/10 blur-2xl" />
            <AuthBox className="relative z-10" />
          </div>
        </div>
      </section>
    </main>
  );
}