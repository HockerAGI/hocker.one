"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Command,
  Cpu,
  Gauge,
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
  icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", hint: "vista central", icon: Gauge },
  { href: "/chat", label: "NOVA", hint: "chat core", icon: Brain },
  { href: "/commands", label: "Comandos", hint: "acciones", icon: Command },
  { href: "/nodes", label: "Nodos", hint: "infra viva", icon: Cpu },
  { href: "/agis", label: "AGIs", hint: "equipo IA", icon: Orbit },
  { href: "/supply", label: "Supply", hint: "operación", icon: Workflow },
  { href: "/governance", label: "Guardia", hint: "seguridad", icon: ShieldCheck },
  { href: "/", label: "Inicio", hint: "entrada", icon: Sparkles },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId } = useWorkspace();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] lg:block">
      <div className="relative flex h-full flex-col overflow-hidden border-r border-white/10 bg-[#050816]/78 shadow-[24px_0_90px_rgba(0,0,0,0.35)] backdrop-blur-3xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_90%_35%,rgba(168,85,247,0.12),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-300/50 to-transparent" />

        <div className="relative px-5 pb-4 pt-5">
          <BrandMark compact className="!px-0 !py-0" />
        </div>

        <div className="relative px-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  Estado
                </p>
                <p className="mt-2 text-sm font-black text-white">Online</p>
              </div>

              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-slate-400">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2">
                <span>Proyecto</span>
                <strong className="truncate text-white">{projectId}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2">
                <span>Nodo</span>
                <strong className="truncate text-white">{nodeId}</strong>
              </div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "group relative flex items-center gap-3 rounded-[22px] border px-4 py-3 transition-all duration-300",
                    active
                      ? "border-cyan-300/25 bg-cyan-300/10 text-white shadow-[0_0_34px_rgba(34,211,238,0.14)]"
                      : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-cyan-300/20 hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
                      active
                        ? "border-cyan-300/20 bg-black/30 text-cyan-200"
                        : "border-white/8 bg-black/20 text-slate-500 group-hover:text-cyan-200",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-black text-white">NOVA Core</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Control limpio. Acción directa.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

