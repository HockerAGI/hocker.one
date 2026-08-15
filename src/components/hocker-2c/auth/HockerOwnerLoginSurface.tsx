"use client";

import Image from "next/image";
import Link from "next/link";
import AuthBox from "@/components/AuthBox";
import SignalBackdrop from "@/components/signal/SignalBackdrop";

export function HockerOwnerLoginSurface() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#030711] text-white">
      <SignalBackdrop />

      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="flex min-h-[118px] w-full max-w-[330px] items-center justify-center rounded-[26px] border border-white/[0.055] bg-white/[0.018] px-6 sm:min-h-[132px] sm:max-w-[370px]"
          aria-label="Hocker One"
        >
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            width={520}
            height={160}
            priority
            className="h-auto w-[230px] object-contain drop-shadow-[0_0_34px_rgba(85,220,255,0.16)] sm:w-[260px]"
          />
        </Link>

        <div className="mt-8 max-w-xl text-center">
          <h1 className="text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Bienvenido</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400 sm:text-[15px]">
            Entra y continúa directamente con NOVA. Aprobaciones, recursos y estado permanecen dentro de Hocker One.
          </p>
        </div>

        <div className="mt-7 flex w-full justify-center">
          <AuthBox />
        </div>

        <p className="mt-5 text-center text-[10px] text-slate-600">
          Sin una sesión válida, las superficies privadas permanecen cerradas.
        </p>
      </section>
    </main>
  );
}
