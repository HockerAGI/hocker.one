"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Brain,
  Command,
  LayoutDashboard,
  MessagesSquare,
  MoveRight,
  Orbit,
  ShieldCheck,
  Sparkles,
  Waves,
  Workflow,
  Cpu,
  Zap
} from "lucide-react";
import BrandMark from "@/components/BrandMark";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Core",
    hint: "Centro",
    icon: LayoutDashboard,
  },
  {
    href: "/chat",
    label: "NOVA",
    hint: "IA madre",
    icon: Brain,
  },
  {
    href: "/commands",
    label: "Órdenes",
    hint: "Ejecución",
    icon: Command,
  },
  {
    href: "/nodes",
    label: "Nodos",
    hint: "Infra",
    icon: Cpu,
  },
  {
    href: "/agis",
    label: "AGIs",
    hint: "Unidades",
    icon: Orbit,
  },
  {
    href: "/supply",
    label: "Supply",
    hint: "Operación",
    icon: Workflow,
  },
  {
    href: "/governance",
    label: "Guardia",
    hint: "Control",
    icon: ShieldCheck,
  },
  {
    href: "/",
    label: "Inicio",
    hint: "Portada",
    icon: Sparkles,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SignalPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/5 bg-white/[0.03] px-3 py-2.5 shadow-[0_10px_40px_rgba(2,6,23,0.16)]">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[284px] lg:block">
      <div className="relative flex h-full w-full flex-col overflow-hidden border-r border-white/5 bg-slate-950/72 backdrop-blur-3xl shadow-[20px_0_80px_rgba(2,6,23,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

        <div className="relative flex items-center justify-between gap-3 px-5 py-5">
          <BrandMark compact className="!px-0 !py-0" />

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">
              Online
            </span>
          </div>
        </div>

        <div className="relative px-5">
          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_14px_50px_rgba(2,6,23,0.2)]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10">
                <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" />
                <Waves className="relative z-10 h-5 w-5 text-sky-300" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
                  NOVA Core
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Sistema vivo
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SignalPill label="Modo" value="Operativo" />
              <SignalPill label="Feed" value="Realtime" />
            </div>

            <div className="mt-3 rounded-[22px] border border-white/5 bg-slate-950/55 p-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-sky-300" />
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                  NOVA
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Cerebro orquestador del ecosistema. Voz, decisiones y control en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <nav className="relative mt-4 flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          <div className="mb-3 px-2">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
              Navegación
            </p>
          </div>

          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative flex items-center gap-3 rounded-[22px] px-4 py-3.5",
                    "border transition-all duration-300",
                    active
                      ? "border-sky-400/20 bg-sky-400/10 text-white shadow-[0_0_24px_rgba(14,165,233,0.12)]"
                      : "border-transparent bg-transparent text-slate-400 hover:border-white/5 hover:bg-white/[0.04] hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                      active
                        ? "border-sky-400/15 bg-sky-400/10"
                        : "border-white/5 bg-white/[0.03] group-hover:border-sky-400/15",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4.5 w-4.5 transition-transform duration-300",
                        active ? "text-sky-300" : "text-slate-400 group-hover:text-sky-300",
                      ].join(" ")}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-black uppercase tracking-[0.22em]">
                      {item.label}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.24em] text-slate-500">
                      {item.hint}
                    </span>
                  </span>

                  <MoveRight
                    className={[
                      "h-4 w-4 transition-all duration-300",
                      active
                        ? "translate-x-0 text-sky-300 opacity-100"
                        : "translate-x-[-4px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                    ].join(" ")}
                  />

                  {active ? (
                    <span className="absolute left-0 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-sky-400 shadow-[0_0_14px_rgba(14,165,233,0.5)]" />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-[26px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                  Estado global
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Todo listo
                </p>
              </div>
              <Activity className="h-5 w-5 text-sky-300" />
            </div>

            <div className="mt-3 grid gap-2">
              <div className="rounded-[18px] border border-white/5 bg-slate-950/45 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Control
                </p>
                <p className="mt-1 text-sm text-slate-200">Hocker ONE activo</p>
              </div>
              <div className="rounded-[18px] border border-white/5 bg-slate-950/45 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Telemetría
                </p>
                <p className="mt-1 text-sm text-slate-200">Realtime conectado</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/5 bg-gradient-to-br from-sky-400/[0.08] to-fuchsia-400/[0.06] p-4 shadow-[0_14px_60px_rgba(2,6,23,0.22)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-300">
                  Sistema seguro
                </p>
                <p className="mt-1 text-sm text-white">
                  Preparado para PWA y APK
                </p>
              </div>
            </div>
          </div>
        </nav>

        <div className="relative border-t border-white/5 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                Hocker ONE
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                Control Plane
              </p>
            </div>
            <Zap className="h-5 w-5 text-sky-300" />
          </div>
        </div>
      </div>
    </aside>
  );
}
