"use client";

import Image from "next/image";
import Link from "next/link";
import AuthBox from "@/components/AuthBox";

export function HockerOwnerLoginSurface() {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-[#050B17] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 -top-48 h-[35rem] w-[35rem] rounded-full bg-cyan-400/[0.08] blur-[110px]" />
        <div className="absolute -bottom-48 right-0 h-[28rem] w-[28rem] rounded-full bg-blue-500/[0.07] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.11) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.11) 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom,black,transparent 85%)" }} />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 py-7 sm:px-9 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Volver al inicio de HOCKER ONE"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
            <Image src="/brand/hocker-one-logo.png" alt="HOCKER ONE" width={190} height={55}
              className="h-auto w-[156px] object-contain sm:w-[190px]" priority />
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-medium tracking-wide text-slate-300">
            Área privada
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-20 lg:py-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
              Un solo espacio para tu ecosistema
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.6rem]">
              Bienvenido a tu <span className="text-[#9BE9FF]">espacio de control.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Gestiona NOVA, consulta tus integraciones y revisa el estado de HOCKER desde una experiencia clara y centralizada.
            </p>
            <div className="mt-9 flex flex-wrap gap-2.5" aria-label="Áreas del panel">
              {["NOVA IA", "Integraciones", "Estado del ecosistema"].map((item) => (
                <span key={item} className="rounded-full border border-white/[0.12] bg-white/[0.035] px-3.5 py-2 text-sm text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full">
            <AuthBox />
            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              El acceso y la información privada requieren una sesión autorizada.
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-white/[0.07] pt-5 text-xs text-slate-400">
          <span>HOCKER AGI Technologies</span>
          <Link href="/" className="font-medium text-slate-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-cyan-300">
            Volver al inicio
          </Link>
        </footer>
      </div>
    </main>
  );
}
