import type { Metadata } from "next";
import Image from "next/image";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada de Hocker One.",
};

export default function LoginPage() {
  const fixedEmail = process.env.HOCKER_LOGIN_EMAIL ?? "contacto.hocker@gmail.com";
  const fixedPassword = process.env.HOCKER_LOGIN_PASSWORD ?? "Hockerpass16";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
            <div className="relative w-full max-w-[560px]">
              <div className="absolute -inset-12 rounded-full bg-sky-500/10 blur-3xl" />
              <Image
                src="/brand/hocker-one-logo.png"
                alt="Hocker One"
                width={900}
                height={240}
                priority
                className="relative h-auto w-full object-contain drop-shadow-[0_0_40px_rgba(14,165,233,0.22)]"
              />
            </div>

            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.45em] text-sky-300">
              Acceso privado
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Entra al panel y sigue el ritmo.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
              Una entrada limpia, rápida y elegante. Sin ruido. Sin vueltas.
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <AuthBox fixedEmail={fixedEmail} fixedPassword={fixedPassword} />
          </div>
        </div>
      </section>
    </main>
  );
}