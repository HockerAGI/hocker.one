import type { Metadata } from "next";
import Image from "next/image";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada de Hocker One.",
};

export default function LoginPage() {
  const fixedEmail = process.env.HOCKER_LOGIN_EMAIL ?? "";
  const fixedPassword = process.env.HOCKER_LOGIN_PASSWORD ?? "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      <section className="relative z-10 w-full max-w-5xl">
        <div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center">
          <div className="relative mb-8 w-full">
            <div className="absolute -inset-10 rounded-full bg-sky-500/10 blur-3xl" />
            <Image
              src="/brand/hocker-one-logo.png"
              alt="Hocker One"
              width={900}
              height={240}
              priority
              className="relative h-auto w-full object-contain drop-shadow-[0_0_40px_rgba(14,165,233,0.22)]"
            />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-sky-300">
            Acceso privado
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Entra al panel y sigue el ritmo.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
            Una entrada limpia, rápida y elegante. Sin ruido. Sin vueltas.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <AuthBox fixedEmail={fixedEmail} fixedPassword={fixedPassword} />
        </div>
      </section>
    </main>
  );
}