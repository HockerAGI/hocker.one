import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  Cpu,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Empresa · Hocker AGI Technologies",
  description:
    "Hocker AGI Technologies: empresa de inteligencia artificial, automatización, publicidad, seguridad y plataformas digitales. Construimos sistemas que operan por ti.",
};

const pillars = [
  {
    icon: Brain,
    title: "IA y automatización",
    text: "Sistemas inteligentes que operan, responden, analizan y venden sin intervención constante. Tu equipo se multiplica sin contratar.",
  },
  {
    icon: Sparkles,
    title: "Publicidad y contenido",
    text: "Campañas, branding, reels, sitios y funnels generados con IA. Más alcance, menos costo, resultados medibles en tiempo real.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Plataformas digitales",
    text: "Apps, paneles de control, CRM, nubes privadas y módulos conectados. Infraestructura hecha a medida de tu operación.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad y control",
    text: "Accesos por nivel, permisos, auditoría completa y operación privada. Tu información protegida con estándares de nivel empresarial.",
  },
];

const values = [
  {
    icon: Target,
    title: "Resultado real, no promesas",
    text: "Cada sistema que entregamos produce valor medible. Nada de demostraciones vacías: todo funciona en producción.",
  },
  {
    icon: Lock,
    title: "Control en tus manos",
    text: "Tú decides qué se ejecuta. El sistema propone, tú apruebas. Transparencia total en cada acción.",
  },
  {
    icon: Cpu,
    title: "Tecnología de punta",
    text: "Usamos los mejores modelos de IA, infraestructura escalable y prácticas modernas. Siempre a la vanguardia.",
  },
  {
    icon: Globe,
    title: "Hecho para escalar",
    text: "Desde un solo usuario hasta miles. Nuestra arquitectura crece contigo sin reinventar lo que ya funciona.",
  },
];

export default function EmpresaPage() {
  return (
    <main className="min-h-[100dvh] bg-[#020610] text-white">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020610]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Inicio">
            <Image
              src="/brand/hocker-one-logo.png"
              alt="Hocker AGI Technologies"
              width={140}
              height={44}
              className="h-auto w-[130px] object-contain"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950 transition-transform hover:-translate-y-0.5"
          >
            <Lock className="h-3.5 w-3.5" />
            Acceso privado
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-10 max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
              <Sparkles className="h-4 w-4" />
              Hocker AGI Technologies
            </span>

            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-7xl">
              Construimos sistemas
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                que trabajan por ti.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Somos una empresa de inteligencia artificial, automatización, publicidad,
              seguridad y plataformas digitales. Diseñamos ecosistemas de agentes IA
              que operan tu negocio bajo tu control, con evidencia y transparencia total.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 px-6 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Entrar al panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ecosistema"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/[0.08]"
              >
                Ver ecosistema
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-400">Lo que hacemos</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Cuatro pilares, una operación completa.</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#0b1526]/60 to-[#050d1a]/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/25 sm:p-8"
                >
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-400">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-white">{pillar.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-400">{pillar.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-400">Cómo trabajamos</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Principios que no negociamos.</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <article
                  key={value.title}
                  className="rounded-[24px] border border-white/[0.06] bg-[#0b1526]/40 p-6 transition-all duration-300 hover:border-white/15"
                >
                  <Icon className="h-7 w-7 text-sky-400" />
                  <h3 className="mt-4 text-lg font-black text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{value.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-[32px] border border-sky-400/15 bg-gradient-to-br from-sky-400/[0.06] to-purple-500/[0.06] p-10 sm:p-14">
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              ¿Listo para multiplicar tu operación?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-slate-300">
              Entra al panel y conversa con NOVA. Delega tu primera tarea y mira cómo
              el sistema trabaja por ti, con tu control siempre presente.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 px-8 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                Entrar al panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contacto"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-8 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/[0.08]"
              >
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <span className="text-sm text-slate-500">© {new Date().getFullYear()} Hocker AGI Technologies</span>
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="text-sm font-semibold text-slate-500 transition-colors hover:text-sky-400">Inicio</Link>
            <Link href="/servicios" className="text-sm font-semibold text-slate-500 transition-colors hover:text-sky-400">Servicios</Link>
            <Link href="/ecosistema" className="text-sm font-semibold text-slate-500 transition-colors hover:text-sky-400">Ecosistema</Link>
            <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-sky-400">Acceso privado</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
