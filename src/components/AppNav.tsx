"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactElement } from "react";
import BrandMark from "@/components/BrandMark";
import NodeBadge from "@/components/NodeBadge";
import WorkspaceBar from "@/components/WorkspaceBar";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactElement;
};

const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.5",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: (p) => <svg {...svgProps} {...p}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg> },
  { href: "/chat", label: "NOVA Chat", icon: (p) => <svg {...svgProps} {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg> },
  { href: "/commands", label: "Acciones", icon: (p) => <svg {...svgProps} {...p}><polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" /></svg> },
  { href: "/nodes", label: "Nodos", icon: (p) => <svg {...svgProps} {...p}><path d="M12 20v-6M6 20V10M18 20V4" /></svg> },
  { href: "/agis", label: "Agentes", icon: (p) => <svg {...svgProps} {...p}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><circle cx="12" cy="12" r="3" /></svg> },
];

export default function AppNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname() || "/";
  const active = useMemo(() => ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.href ?? "", [pathname]);

  if (isMobile) {
    return (
      <nav className="flex items-center justify-around px-2">
        {ITEMS.map((it) => {
          const isActive = active === it.href;
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={`p-4 rounded-2xl transition-all ${isActive ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40" : "text-slate-500"}`}>
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-10 transition-transform hover:scale-105 active:scale-95">
        <BrandMark compact showWordmark />
      </div>

      <div className="space-y-8 flex-1">
        <section>
          <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4">Sistemas Centrales</h3>
          <div className="space-y-1">
            {ITEMS.map((it) => {
              const isActive = active === it.href;
              const Icon = it.icon;
              return (
                <Link key={it.href} href={it.href} className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${isActive ? "bg-sky-500/10 text-sky-400 shadow-[inset_3px_0_0_0_#0ea5ff]" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                  {it.label}
                </Link>
              );
            })}
          </div>
        </section>
        
        <WorkspaceBar />
        <NodeBadge />
      </div>
      
      <div className="pt-6 border-t border-white/5">
         <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/5 p-3 border border-emerald-500/10">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Conexión Segura</span>
         </div>
      </div>
    </div>
  );
}
