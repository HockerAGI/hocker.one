"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Database,
  LayoutDashboard,
  MessageSquareText,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import NodeBadge from "@/components/NodeBadge";
import WorkspaceBar from "@/components/WorkspaceBar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hint: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Sparkles, hint: "Entrada" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Resumen" },
  { href: "/chat", label: "NOVA", icon: MessageSquareText, hint: "Chat" },
  { href: "/commands", label: "Acciones", icon: Workflow, hint: "Órdenes" },
  { href: "/nodes", label: "Nodos", icon: Database, hint: "Red" },
  { href: "/agis", label: "Células", icon: Bot, hint: "Agentes" },
  { href: "/governance", label: "Seguridad", icon: Shield, hint: "Control" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNav() {
  const pathname = usePathname() || "/";

  return (
    <aside className="hidden xl:fixed xl:inset-y-4 xl:left-4 xl:z-50 xl:flex xl:w-[330px] xl:flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-[34px] border border-white/5 bg-slate-950/82 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
        <BrandMark className="w-full" />

        <div className="mt-5 rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400">
            Control plane
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Navegación clara. Marca dominante. Sin ruido.
          </p>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${
                    active
                      ? "border border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-[0_0_18px_rgba(14,165,233,0.08)]"
                      : "border border-transparent text-slate-400 hover:border-white/5 hover:bg-white/[0.04] hover:text-slate-100"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-all ${
                      active
                        ? "border-sky-400/20 bg-sky-500/10"
                        : "border-white/5 bg-white/[0.03] group-hover:border-sky-500/20"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${active ? "text-sky-300" : "text-slate-400"}`} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-black uppercase tracking-widest">
                      {item.label}
                    </span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <WorkspaceBar />
            <NodeBadge />
          </div>
        </div>
      </div>
    </aside>
  );
}