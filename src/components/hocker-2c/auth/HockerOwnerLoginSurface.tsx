"use client";

import Link from "next/link";
import AuthBox from "@/components/AuthBox";

export function HockerOwnerLoginSurface() {
  return (
    <main className="hocker-soft-shell min-h-[100dvh] overflow-hidden text-white">
      <section className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
          <div className="absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-cyan-400/8 blur-3xl" />
          <div className="absolute bottom-[10%] right-[6%] h-72 w-72 rounded-full bg-blue-500/8 blur-3xl" />
        </div>

        <div className="relative z-10 w-full text-center">
          <Link href="/" className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-white/[0.07]">
            Hocker One
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Bienvenido</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
            Inicia sesión para entrar a tu espacio privado. El estado operativo se consulta después de autenticarte.
          </p>
        </div>

        <div className="relative z-10 mt-7 flex w-full justify-center">
          <AuthBox />
        </div>

        <p className="relative z-10 mt-5 text-center text-xs text-slate-600">
          Sin una sesión válida, las superficies privadas permanecen cerradas.
        </p>
      </section>
    </main>
  );
}
