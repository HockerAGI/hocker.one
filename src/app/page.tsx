import type { ComponentType } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Command,
  Cpu,
  Gauge,
  MessageSquareText,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Centro visual de control para Hocker AGI.",
};

type ModuleCard = {
  href: string;
  title: string;
  short: string;
  status: string;
  icon: ComponentType<{ className?: string }>;
};

const modules: ModuleCard[] = [
  {
    href: "/dashboard",
    title: "Panel",
    short: "Todo lo importante en una sola vista.",
    status: "Live",
    icon: Gauge,
  },
  {
    href: "/chat",
    title: "NOVA",
    short: "Decisiones, contexto y respuesta directa.",
    status: "Core",
    icon: Brain,
  },
  {
    href: "/commands",
    title: "Comandos",
    short: "Acciones, cola y aprobaciones.",
    status: "Ops",
    icon: Command,
  },
  {
    href: "/nodes",
    title: "Nodos",
    short: "Cloud, físico y runtime visible.",
    status: "Sync",
    icon: Cpu,
  },
  {
    href: "/governance",
    title: "Guardia",
    short: "Killswitch y control sensible.",
    status: "Safe",
    icon: ShieldCheck,
  },
  {
    href: "/supply",
    title: "Supply",
    short: "Productos, órdenes y operación.",
    status: "Flow",
    icon: Workflow,
  },
];

function ModuleCard({ item, index }: { item: ModuleCard; index: number }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="hkr-cine-card group"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
          <Icon className="h-5 w-5" />
        </div>

        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
          {item.status}
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="text-lg font-black tracking-tight text-white">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.short}</p>
      </div>

      <div className="relative mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500 transition group-hover:text-cyan-200">
        Abrir
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function StatusBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-500">
          {label}
        </p>
        <p className="text-xs font-black text-white">{value}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 shadow-[0_0_22px_rgba(56,189,248,0.35)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OrbitMap() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[430px] rounded-[44px] border border-white/8 bg-black/20 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
      <div className="absolute inset-5 rounded-full border border-cyan-300/10" />
      <div className="absolute inset-14 rounded-full border border-fuchsia-300/10" />
      <div className="absolute inset-24 rounded-full border border-white/10" />

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_70px_rgba(34,211,238,0.22)]">
        <div className="text-center">
          <Sparkles className="mx-auto h-6 w-6 text-cyan-200" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.26em] text-cyan-100">
            NOVA
          </p>
        </div>
      </div>

      {[
        ["Web", "left-[12%] top-[18%]"],
        ["PWA", "right-[12%] top-[20%]"],
        ["APK", "left-[10%] bottom-[22%]"],
        ["API", "right-[11%] bottom-[20%]"],
      ].map(([label, position]) => (
        <div
          key={label}
          className={`absolute ${position} rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black text-white backdrop-blur-xl`}
        >
          {label}
        </div>
      ))}

      <div className="absolute inset-0 rounded-[44px] bg-[conic-gradient(from_120deg,transparent,rgba(34,211,238,0.16),transparent,rgba(168,85,247,0.14),transparent)] opacity-70 animate-[hkr-spin_14s_linear_infinite]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="hkr-cine-bg relative min-h-screen overflow-hidden px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="hkr-noise" />
      <div className="hkr-scan" />

      <section className="relative mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-[1720px] gap-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div className="hkr-hero-panel">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="hkr-chip">
              <Zap className="h-3.5 w-3.5" />
              Hocker ONE
            </span>
            <span className="hkr-chip-muted">Web · PWA · Android</span>
          </div>

          <div className="relative max-w-[420px]">
            <Image
              src="/brand/hocker-one-logo.png"
              alt="Hocker ONE"
              width={1200}
              height={320}
              priority
              className="h-auto w-full object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.18)]"
            />
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Control total.
            <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
              Sin ruido.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Hocker ONE junta conversación, comandos, nodos, seguridad y operación en una app clara.
            Menos texto. Más acción.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="hkr-button-main">
              Abrir panel
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/chat" className="hkr-button-soft">
              Hablar con NOVA
              <MessageSquareText className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatusBar label="Sistema" value="Activo" pct={92} />
            <StatusBar label="Android" value="APK OK" pct={84} />
            <StatusBar label="Control" value="Seguro" pct={88} />
          </div>
        </div>

        <div className="grid gap-5">
          <OrbitMap />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((item, index) => (
              <ModuleCard key={item.href} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

