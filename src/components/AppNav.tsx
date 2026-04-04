"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  Workflow,
  Bot,
  Network,
  Shield,
  Sparkles,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import WorkspaceBar from "@/components/WorkspaceBar";
import NodeBadge from "@/components/NodeBadge";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  hint: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Sparkles, hint: "Entrada" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Resumen" },
  { href: "/chat", label: "NOVA", icon: MessageSquareText, hint: "Chat" },
  { href: "/commands", label: "Acciones", icon: Workflow, hint: "Órdenes" },
  { href: "/nodes", label: "Nodos", icon: Network, hint: "Red" },
  { href: "/agis", label: "Células", icon: Bot, hint: "Agentes" },
  { href: "/governance", label: "Seguridad", icon: Shield, hint: "Control" },
];

type AppNavProps = {
  isMobile?: boolean;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="grid grid-cols-7 gap-1 px-2 pb-2">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all active:scale-95 ${
              active ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {active ? (
              <span className="absolute -top-1 h-1 w-7 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.45)]" />
            ) : null}

            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate text-[9px] font-black uppercase tracking-widest">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden p-6">
      <div className="shrink-0">
        <BrandMark className="w-full" />
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="mb-4 rounded-[28px] border border-white/5 bg-white/[0.03] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400">
            Control plane
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Navegación simple. Todo a un toque.
          </p>
        </div>

        <section className="space-y-2">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Sistemas
          </p>

          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
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
        </section>

        <div className="mt-6 space-y-4">
          <WorkspaceBar />
          <NodeBadge />
        </div>
      </div>
    </div>
  );
}

export default function AppNav({ isMobile = false }: AppNavProps) {
  const pathname = usePathname() || "/";

  const nav = useMemo(() => {
    return isMobile ? <MobileNav pathname={pathname} /> : <DesktopNav pathname={pathname} />;
  }, [isMobile, pathname]);

  return nav;
}