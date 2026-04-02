"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (p) => (
      <svg {...svgProps} {...p}>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "NOVA",
    icon: (p) => (
      <svg {...svgProps} {...p}>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
  {
    href: "/commands",
    label: "Acciones",
    icon: (p) => (
      <svg {...svgProps} {...p}>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" x2="20" y1="19" y2="19" />
      </svg>
    ),
  },
  {
    href: "/nodes",
    label: "Nodos",
    icon: (p) => (
      <svg {...svgProps} {...p}>
        <path d="M12 20v-6M6 20V10M18 20V4" />
      </svg>
    ),
  },
  {
    href: "/agis",
    label: "Agentes",
    icon: (p) => (
      <svg {...svgProps} {...p}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

type AppNavProps = {
  isMobile?: boolean;
};

export default function AppNav({ isMobile = false }: AppNavProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const active = useMemo(
    () => ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.href ?? "",
    [pathname],
  );

  if (isMobile) {
    return (
      <div className="grid grid-cols-5 gap-1 px-2 pb-2">
        {ITEMS.map((it) => {
          const isActive = active === it.href;
          const Icon = it.icon;

          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all active:scale-95 touch-manipulation ${
                isActive ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {isActive ? (
                <div className="absolute -top-1 h-1 w-6 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
              ) : null}

              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[9px] font-black uppercase tracking-widest">
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6 custom-scrollbar">
      <div className="mb-10 transition-transform hover:scale-105">
        <BrandMark showWordmark hero={false} className="origin-left scale-110" />
      </div>

      <div className="flex flex-1 flex-col gap-8">
        <section>
          <h3 className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Sistemas Centrales
          </h3>

          <div className="space-y-1.5">
            {ITEMS.map((it) => {
              const isActive = active === it.href;
              const Icon = it.icon;

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[13px] font-bold transition-all active:scale-95 touch-manipulation ${
                    isActive
                      ? "bg-sky-500/10 text-sky-400 shadow-[inset_3px_0_0_0_#0ea5ff]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  {it.label}
                  {isActive ? (
                    <div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>

        <WorkspaceBar />
        <NodeBadge />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10 active:scale-95 touch-manipulation"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retroceder
        </button>

        <form action="/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95 touch-manipulation"
          >
            Desconectar Matriz
          </button>
        </form>
      </div>
    </div>
  );
}