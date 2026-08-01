import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

const PUBLIC_NAVIGATION = [
  { href: "/empresa", label: "Empresa" },
  { href: "/servicios", label: "Servicios" },
  { href: "/soluciones", label: "Soluciones" },
  { href: "/casos", label: "Casos" },
  { href: "/ecosistema", label: "Ecosistema" },
  { href: "/seguridad", label: "Seguridad" },
  { href: "/contacto", label: "Contacto" },
] as const;

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
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.035)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute right-[-12rem] top-[12%] h-[36rem] w-[36rem] rounded-full bg-blue-500/10 blur-[150px]" />
        <div className="absolute bottom-[-18rem] left-[32%] h-[34rem] w-[34rem] rounded-full bg-sky-400/8 blur-[150px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#030711]/84 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Volver al inicio de Hocker ONE"
          >
            <Image
              src="/brand/hocker-one-logo.png"
              alt="Hocker ONE"
              width={520}
              height={160}
              priority
              className="h-auto w-[136px] object-contain drop-shadow-[0_0_22px_rgba(56,189,248,0.18)] sm:w-[154px]"
            />
          </Link>

          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Navegación pública">
            {PUBLIC_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-[11px] font-bold text-slate-400 transition-colors hover:bg-white/[0.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="ml-auto inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 transition-colors hover:bg-cyan-300/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 xl:ml-2"
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Acceso privado</span>
            <span className="sm:hidden">Entrar</span>
          </Link>
        </div>

        <nav
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 xl:hidden"
          aria-label="Secciones públicas"
        >
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-transparent px-3 text-[10px] font-bold text-slate-500 transition-colors hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="max-w-5xl">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 shadow-[0_0_36px_rgba(34,211,238,0.08)]">
            <Sparkles className="h-4 w-4" />
            {eyebrow}
          </span>

          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.93] tracking-[-0.06em] text-white sm:text-7xl lg:text-[5.6rem]">
            {title}
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg lg:text-xl lg:leading-9">
            {description}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_50px_rgba(34,211,238,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030711]"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {secondaryLabel}
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold text-slate-500">
            {["Diseño orientado a operación", "Control humano", "Evidencia verificable"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400/80" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {cards.length ? (
        <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28" aria-label={`Capacidades de ${eyebrow}`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card, index) => (
              <article
                key={card.title}
                className="group relative min-h-[190px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-[#07101f]/78 to-cyan-400/[0.025] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_42%)] opacity-70" aria-hidden="true" />
                <div className="relative">
                  <span className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300/55">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-5 text-2xl font-black tracking-[-0.035em] text-white">
                    {card.title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
                    {card.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="relative border-t border-white/[0.07] bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-slate-300">Hocker AGI Technologies</p>
            <p className="mt-1 leading-6">Inteligencia, software y operación conectados bajo control humano.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold hover:bg-white/[0.04] hover:text-white">Inicio</Link>
            <Link href="/contacto" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold hover:bg-white/[0.04] hover:text-white">Contacto</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold hover:bg-white/[0.04] hover:text-white">Privado</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
