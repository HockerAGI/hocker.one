"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Command,
  Cpu,
  LayoutDashboard,
  MoveRight,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Core", hint: "Centro", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", hint: "IA madre", icon: Brain },
  { href: "/commands", label: "Órdenes", hint: "Ejecución", icon: Command },
  { href: "/nodes", label: "Nodos", hint: "Infra", icon: Cpu },
  { href: "/agis", label: "AGIs", hint: "Unidades", icon: Orbit },
  { href: "/supply", label: "Supply", hint: "Operación", icon: Workflow },
  { href: "/governance", label: "Guardia", hint: "Control", icon: ShieldCheck },
  { href: "/", label: "Inicio", hint: "Portada", icon: Sparkles },
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
  const { projectId, nodeId, tutorial } = useWorkspace();

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
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-400">
              Sync
            </span>
          </div>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                    active
                      ? "bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(2,6,23,0.15)]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
                  )}

                  <div
                    className={`relative flex items-center justify-center transition-transform duration-300 ${
                      active ? "scale-110" : "group-hover:scale-110"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${
                        active
                          ? "bg-sky-400/40 opacity-100"
                          : "bg-white/20 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                    <Icon
                      className={`relative z-10 h-[18px] w-[18px] transition-colors duration-300 ${
                        active
                          ? "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)]"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                        active
                          ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                          : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider transition-colors duration-300 ${
                        active ? "text-sky-400" : "text-slate-500"
                      }`}
                    >
                      {item.hint}
                    </span>
                  </div>

                  {active && (
                    <MoveRight className="absolute right-4 h-4 w-4 text-sky-400/50 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative mt-auto border-t border-white/5 bg-slate-950/40 px-5 py-6 backdrop-blur-md">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <SignalPill label="PROYECTO" value={projectId} />
            <SignalPill label="NODO" value={nodeId} />
          </div>

          <div className="relative flex items-center justify-between rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                NOVA Core
              </p>
              <p className="mt-1 text-xs font-semibold text-sky-100/90">
                {tutorial ? "Guía activa" : "Sistema en vivo"}
              </p>
            </div>
            <Zap className="h-5 w-5 text-sky-300" />
          </div>
        </div>
      </div>
    </aside>
  );
}