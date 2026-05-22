import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";

type HockerPublicPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  cards?: Array<{
    title: string;
    text: string;
  }>;
};

export default function HockerPublicPage({
  eyebrow,
  title,
  description,
  primaryHref = "/contacto",
  primaryLabel = "Solicitar acceso",
  secondaryHref = "/one",
  secondaryLabel = "Ver Hocker ONE",
  cards = [],
}: HockerPublicPageProps) {
  return (
    <main className="min-h-[100dvh] bg-[#030711] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[#07101f] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-10">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Volver al inicio">
            <Image src="/brand/hocker-one-logo.png" alt="Hocker ONE" width={520} height={160} priority className="h-auto w-[176px] object-contain" />
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.16em] text-white">
            Privado
            <Lock className="h-4 w-4" />
          </Link>
        </nav>

        <div className="mt-16 max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Sparkles className="h-4 w-4" />
            {eyebrow}
          </span>

          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-7xl">
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-black uppercase tracking-[0.18em] text-white">
              {secondaryLabel}
              <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {cards.length ? (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <article key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                <h2 className="text-xl font-black text-white">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.text}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
