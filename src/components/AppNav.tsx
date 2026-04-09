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

type AppNavProps = {
  isMobile?: boolean;
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

function AppNavRail() {
  const pathname = usePathname() || "/";

  return (
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
        <nav className="space-y-2" aria-label="Navegación lateral">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group flex items-center gap-3 rounded-[22px] border px-4 py-3 transition-all duration-300",
                  active
                    ? "border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_25px_rgba(14,165,233,0.08)]"
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
                    active ? "bg-sky-500 text-black shadow-[0_0_25px_rgba(14,165,233,0.35)]" : "bg-white/[0.03]",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-black uppercase tracking-[0.3em]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {item.hint}
                  </span>
                </span>

                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-sky-300">
                  Abrir
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-4">
          <WorkspaceBar />
          <NodeBadge />
        </div>
      </div>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname() || "/";

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-2 pt-1">
      <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-[30px] border border-white/10 bg-slate-950/90 p-2 shadow-[0_22px_90px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const isNova = item.href === "/chat";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative flex min-w-[74px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-center",
                "transition-all duration-300 active:scale-90",
                active ? "text-sky-300" : "text-slate-400 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-0 rounded-2xl blur-xl opacity-0 transition-all duration-500",
                  active
                    ? "bg-sky-500/20 opacity-100"
                    : isNova
                      ? "bg-sky-500/10 group-hover:opacity-60"
                      : "group-hover:bg-white/5 group-hover:opacity-40",
                ].join(" ")}
              />

              <div
                className={[
                  "relative flex items-center justify-center rounded-xl transition-all duration-300",
                  isNova
                    ? "h-11 w-11 bg-sky-500 text-black shadow-[0_0_25px_rgba(14,165,233,0.55)] group-hover:scale-110"
                    : "h-9 w-9",
                  active && !isNova ? "bg-sky-500/10" : "",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 transition-transform duration-300",
                    isNova ? "text-black" : "group-hover:-translate-y-0.5",
                  ].join(" ")}
                />
              </div>

              <span
                className={[
                  "text-[9px] font-black uppercase tracking-widest leading-none",
                  isNova ? "text-sky-300" : "",
                ].join(" ")}
              >
                {item.label}
              </span>

              {active ? (
                <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-sky-400 shadow-[0_0_10px_#0ea5e9]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function AppNav({ isMobile = false }: AppNavProps) {
  if (isMobile) return <MobileNav />;
  return <AppNavRail />;
}