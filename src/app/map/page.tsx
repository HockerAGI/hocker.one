import type { Metadata } from "next";
import Link from "next/link";
import { getHockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import MapLivePulse from "@/components/map/MapLivePulse";
import EcosystemVfxNetwork from "@/components/map/EcosystemVfxNetwork";
import {
  Activity,
  Brain,
  CheckSquare,
  CircleDot,
  DatabaseZap,
  FileText,
  Gamepad2,
  Grid2X2,
  Landmark,
  Layers3,
  Lock,
  Map,
  Network,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mapa | Hocker ONE",
  description: "Mapa claro del ecosistema HOCKER.",
};

type MapCard = {
  href: string;
  title: string;
  text: string;
  group: "central" | "apps" | "sistema" | "control" | "negocio";
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "emerald" | "amber" | "violet" | "rose" | "slate";
};

const cards: MapCard[] = [
  {
    href: "/live",
    title: "Sistema en vivo",
    text: "Agente físico, nodo espejo y memoria IA.",
    group: "central",
    icon: Activity,
    tone: "emerald",
  },
  {
    href: "/chat",
    title: "NOVA",
    text: "Canal central para resolver y decidir.",
    group: "central",
    icon: Brain,
    tone: "cyan",
  },
  {
    href: "/commands",
    title: "Tareas",
    text: "Acciones claras, revisadas y protegidas.",
    group: "central",
    icon: CheckSquare,
    tone: "amber",
  },
  {
    href: "/apps",
    title: "Apps",
    text: "Plataformas del ecosistema.",
    group: "apps",
    icon: Grid2X2,
    tone: "cyan",
  },
  {
    href: "/agis",
    title: "AGIs",
    text: "NOVA, Tridente y AGIs operativas.",
    group: "apps",
    icon: Sparkles,
    tone: "violet",
  },
  {
    href: "/memory",
    title: "Memoria IA",
    text: "Aprendizajes y contexto aprobado.",
    group: "sistema",
    icon: DatabaseZap,
    tone: "emerald",
  },
  {
    href: "/nodes",
    title: "Nodos",
    text: "Conexiones, espejo y señales.",
    group: "sistema",
    icon: Network,
    tone: "cyan",
  },
  {
    href: "/status",
    title: "Estado general",
    text: "Lectura rápida del sistema.",
    group: "sistema",
    icon: CircleDot,
    tone: "slate",
  },
  {
    href: "/security",
    title: "Seguridad",
    text: "Acceso protegido y revisión.",
    group: "control",
    icon: ShieldCheck,
    tone: "emerald",
  },
  {
    href: "/governance",
    title: "Gobierno",
    text: "Reglas, permisos y control.",
    group: "control",
    icon: Lock,
    tone: "amber",
  },
  {
    href: "/admin/jurix",
    title: "Jurix",
    text: "Legal, contratos y revisión.",
    group: "control",
    icon: FileText,
    tone: "violet",
  },
  {
    href: "/chido",
    title: "Chido Casino",
    text: "Gaming, riesgo y operación responsable.",
    group: "negocio",
    icon: Gamepad2,
    tone: "rose",
  },
  {
    href: "/supply",
    title: "Supply",
    text: "Productos, pedidos y tienda.",
    group: "negocio",
    icon: Store,
    tone: "cyan",
  },
  {
    href: "/owner",
    title: "Inicio",
    text: "Pulso principal de Hocker ONE.",
    group: "central",
    icon: Landmark,
    tone: "slate",
  },
  {
    href: "/servicios",
    title: "Servicios",
    text: "Oferta pública y comercial.",
    group: "negocio",
    icon: Layers3,
    tone: "amber",
  },
];

const groups = [
  {
    id: "central",
    title: "Centro",
    text: "Lo que más se usa.",
  },
  {
    id: "apps",
    title: "Ecosistema",
    text: "Apps y AGIs.",
  },
  {
    id: "sistema",
    title: "Sistema",
    text: "Estado, memoria y nodos.",
  },
  {
    id: "control",
    title: "Control",
    text: "Seguridad, legal y reglas.",
  },
  {
    id: "negocio",
    title: "Negocio",
    text: "Áreas comerciales.",
  },
] as const;

function toneClass(tone: MapCard["tone"]) {
  if (tone === "cyan") return "border-cyan-300/20 bg-cyan-300/8 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.08)]";
  if (tone === "emerald") return "border-emerald-300/20 bg-emerald-300/8 text-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.08)]";
  if (tone === "amber") return "border-amber-300/20 bg-amber-300/8 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.08)]";
  if (tone === "violet") return "border-violet-300/20 bg-violet-300/8 text-violet-100 shadow-[0_0_28px_rgba(167,139,250,0.08)]";
  if (tone === "rose") return "border-rose-300/20 bg-rose-300/8 text-rose-100 shadow-[0_0_28px_rgba(251,113,133,0.08)]";
  return "border-white/10 bg-white/[0.045] text-slate-100";
}

function MapNode({ card, featured = false }: { card: MapCard; featured?: boolean }) {
  const Icon = card.icon;

  return (
    <Link
      href={card.href}
      className={[
        "group relative overflow-hidden rounded-[30px] border p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07]",
        toneClass(card.tone),
        featured ? "min-h-[166px]" : "min-h-[142px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-300">
          Abrir
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="text-xl font-black tracking-[-0.04em] text-white">{card.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
      </div>
    </Link>
  );
}

export default async function MapPage() {
  const livePulse = await getHockerLivePulseSummary();
  const liveCard = cards.find((card) => card.href === "/live");
  const novaCard = cards.find((card) => card.href === "/chat");
  const memoryCard = cards.find((card) => card.href === "/memory");

  return (
    <main className="space-y-5 pb-28">
      <MapLivePulse summary={livePulse} />
      <EcosystemVfxNetwork summary={livePulse} />
      <section className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.13),transparent_30%),rgba(255,255,255,0.035)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.36)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:52px_52px]" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
            <Map className="h-4 w-4" />
            Mapa
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl">
            Todo Hocker ONE en una sola vista.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Entra rápido a cada área. Sin buscar rutas, sin nombres raros y sin datos inventados.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Ruta clave</p>
              <strong className="mt-2 block text-lg font-black text-white">Sistema en vivo</strong>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Centro</p>
              <strong className="mt-2 block text-lg font-black text-white">NOVA</strong>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Orden</p>
              <strong className="mt-2 block text-lg font-black text-white">Apps + AGIs</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.035] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Ruta viva</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">NOVA conecta todo</h2>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
            visible
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_0.9fr_1fr]">
          {novaCard ? <MapNode card={novaCard} featured /> : null}

          <div className="relative flex min-h-[166px] items-center justify-center rounded-[30px] border border-white/10 bg-slate-950/45 p-5">
            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-cyan-300/10 via-cyan-200/60 to-emerald-300/10" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_45px_rgba(34,211,238,0.14)]">
              <span className="absolute h-full w-full animate-ping rounded-full border border-cyan-300/20" />
              <Network className="relative h-9 w-9 text-cyan-100" />
            </div>
          </div>

          {liveCard ? <MapNode card={liveCard} featured /> : null}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Link href="/apps" className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]">
            Apps conectadas
          </Link>
          <Link href="/agis" className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]">
            AGIs ordenadas
          </Link>
          {memoryCard ? (
            <Link href={memoryCard.href} className="rounded-[26px] border border-emerald-300/15 bg-emerald-300/8 p-4 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/12">
              Memoria IA
            </Link>
          ) : null}
        </div>
      </section>

      {groups.map((group) => {
        const items = cards.filter((card) => card.group === group.id);

        return (
          <section key={group.id} className="rounded-[34px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{group.text}</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">{group.title}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((card) => (
                <MapNode key={card.href} card={card} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
