import type { Metadata } from "next";
import Image from "next/image";
import AuthBox from "@/components/AuthBox";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entrada privada Hocker ONE",
};

export default function LoginPage() {
  const fixedEmail = "contacto.hocker@gmail.com";
  const fixedPassword = "Hockerpass16";

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">

      {/* Fondo base */}
      <div className="absolute inset-0 bg-hocker-aurora" />

      {/* Glow dinámico */}
      <div className="absolute inset-0 animate-[hocker-pulse_6s_ease-in-out_infinite] opacity-30 bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_60%)]" />

      {/* Grid suave */}
      <div className="absolute inset-0 hocker-grid-soft opacity-30" />

      {/* Contenido */}
      <section className="relative z-10 w-full max-w-5xl flex flex-col items-center">

        {/* Logo cinematográfico */}
        <div className="relative flex justify-center mb-10 animate-[hocker-enter_900ms_cubic-bezier(0.16,1,0.3,1)_both]">

          {/* Glow fuerte */}
          <div className="absolute inset-0 blur-3xl opacity-50 bg-[radial-gradient(circle,rgba(14,165,233,0.35),transparent_65%)]" />

          {/* Glow secundario animado */}
          <div className="absolute inset-0 animate-[hocker-pulse_5s_ease-in-out_infinite] opacity-30 bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_60%)]" />

          {/* Logo */}
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            width={460}
            height={140}
            priority
            className="relative object-contain drop-shadow-[0_20px_80px_rgba(14,165,233,0.35)] animate-[float-soft_6s_ease-in-out_infinite]"
          />
        </div>

        {/* Subtexto */}
        <p className="text-sm text-slate-400 mb-8 text-center max-w-md animate-[hocker-enter_1.2s_ease_both]">
          Control total. Automatización. Ejecución sin fricción.
        </p>

        {/* Login box */}
        <div className="w-full max-w-md relative animate-[hocker-enter_1.4s_ease_both]">

          {/* Glow contenedor */}
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-sky-400/10 to-purple-500/10 blur-2xl" />

          <AuthBox
            fixedEmail={fixedEmail}
            fixedPassword={fixedPassword}
            className="relative z-10"
          />
        </div>

      </section>
    </main>
  );
}
