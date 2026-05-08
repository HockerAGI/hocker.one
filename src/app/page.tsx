import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Hocker AGI Technologies",
  description: "Sitio público en preparación de Hocker AGI Technologies.",
};

export default function PublicHomePage() {
  return (
    <main className="min-h-[100dvh] bg-[#030711] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col justify-center overflow-hidden rounded-[34px] border border-white/10 bg-[#07101f] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-10">
        <div className="max-w-3xl">
          <Image src="/brand/hocker-one-logo.png" alt="Hocker" width={520} height={160} priority className="mb-10 h-auto w-[220px] object-contain" />

          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Sparkles className="h-4 w-4" />
            Sitio en preparación
          </span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-7xl">
            Hocker AGI Technologies.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Empresa de inteligencia artificial, automatización, publicidad, seguridad y plataformas digitales. El sitio público está listo para crecer sin exponer el panel privado.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/empresa" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
              Ver empresa
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-black uppercase tracking-[0.18em] text-white">
              Acceso privado
              <Lock className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
