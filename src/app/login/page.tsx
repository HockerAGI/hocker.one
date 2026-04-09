import type { Metadata } from "next";
import Image from "next/image";
import BrandMark from "@/components/BrandMark";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada de Hocker ONE.",
};

export default function LoginPage() {
  const fixedEmail = "contacto.hocker@gmail.com";
  const fixedPassword = "Hockerpass16";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-8 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/12 blur-3xl animate-[pulse_11s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/12 blur-3xl animate-[pulse_13s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/15 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="relative flex items-center justify-center overflow-hidden rounded-[42px] border border-white/5 bg-slate-950/35 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.42)] backdrop-blur-3xl sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_42%)]" />
            <div className="pointer-events-none absolute left-8 top-8 h-28 w-28 rounded-full border border-white/8 bg-white/[0.04] blur-[1px] animate-[float-soft_8s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute right-8 bottom-8 h-32 w-32 rounded-full border border-sky-400/15 bg-sky-500/[0.05] blur-[1px] animate-[float-soft_9s_ease-in-out_infinite]" />

            <div className="relative flex w-full max-w-[920px] flex-col items-center text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.55em] text-sky-300">
                Bienvenido al núcleo
              </p>

              <div className="mt-7 w-full max-w-[920px]">
                <BrandMark hero className="mx-auto scale-[1.02]" />
              </div>

              <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3">
                <span className="hocker-chip">Vidrio</span>
                <span className="hocker-chip">Profundidad</span>
                <span className="hocker-chip">VFX</span>
                <span className="hocker-chip">Acceso seguro</span>
              </div>

              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Entrada limpia, cinematográfica y directa. Una sola acción para entrar.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center xl:justify-end">
            <AuthBox
              fixedEmail={fixedEmail}
              fixedPassword={fixedPassword}
              className="animate-[hocker-enter_700ms_ease_both]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}