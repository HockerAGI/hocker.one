"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Command,
  Cpu,
  LayoutDashboard,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
  Activity,
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
  { href: "/dashboard", label: "Dashboard", hint: "Centro", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", hint: "NOVA", icon: Brain },
  { href: "/commands", label: "Comandos", hint: "Runtime", icon: Command },
  { href: "/nodes", label: "Nodos", hint: "Infra", icon: Cpu },
  { href: "/agis", label: "AGIs", hint: "Registro", icon: Orbit },
  { href: "/supply", label: "Supply", hint: "Operación", icon: Workflow },
  { href: "/governance", label: "Guardia", hint: "Control", icon: ShieldCheck },
  { href: "/", label: "Inicio", hint: "Portada", icon: Sparkles },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId, tutorial } = useWorkspace();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[290px] lg:block">
      <div className="relative flex h-full w-full flex-col overflow-hidden border-r border-white/6 bg-slate-950/72 backdrop-blur-3xl shadow-[24px_0_90px_rgba(2,6,23,0.34)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="relative px-5 pb-4 pt-5">
          <BrandMark compact className="!px-0 !py-0" />
        </div>

        <div className="relative px-4">
          <div className="shell-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">control plane</p>
                <p className="mt-2 text-sm font-black text-white">Hocker ONE</p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-300">
                  sync
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  proyecto
                </p>
                <p className="mt-2 text-sm font-black text-white">{projectId}</p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  nodo
                </p>
                <p className="mt-2 text-sm font-black text-white">{nodeId}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-4">
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
                      ? "border-sky-400/20 bg-sky-500/10 shadow-[0_0_30px_rgba(14,165,233,0.12)]"
                      : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                      active
                        ? "border-sky-400/20 bg-slate-950/70 text-sky-300"
                        : "border-white/8 bg-slate-950/60 text-slate-400 group-hover:text-slate-200",
                    ].join(" ")}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0">
                    <p className={["text-sm font-black", active ? "text-white" : "text-slate-300"].join(" ")}>
                      {item.label}
                    </p>
                    <p className={["text-[10px] uppercase tracking-[0.28em]", active ? "text-sky-300" : "text-slate-500"].join(" ")}>
                      {item.hint}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative border-t border-white/6 bg-slate-950/45 px-4 py-5">
          <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-sky-300">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">NOVA Core</p>
                <p className="mt-1 text-xs text-slate-400">
                  {tutorial ? "Guía activa" : "Sistema operativo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
