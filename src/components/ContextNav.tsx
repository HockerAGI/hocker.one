"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getActiveHockerSection,
  isHockerRouteActive,
} from "@/lib/hocker-navigation";

export default function ContextNav() {
  const pathname = usePathname() || "/owner";
  const section = getActiveHockerSection(pathname);

  return (
    <nav
      className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#050d1a]/82 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
      aria-label={`Vistas de ${section.label}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.10),transparent_38%),linear-gradient(120deg,rgba(255,255,255,0.025),transparent_45%)]"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-1.5 overflow-x-auto hko-sidebar-scroll">
        <span className="hidden shrink-0 px-3 text-[9px] font-black uppercase tracking-[0.24em] text-slate-600 xl:inline">
          {section.label}
        </span>
        {section.items.map((item) => {
          const Icon = item.icon;
          const active = isHockerRouteActive(pathname, item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[16px] border px-3.5 text-[11px] font-bold transition-all",
                active
                  ? "border-sky-400/25 bg-sky-400/12 text-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.06)]"
                  : "border-transparent text-slate-500 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-200",
              ].join(" ")}
            >
              <Icon className={active ? "h-4 w-4 text-sky-300" : "h-4 w-4 text-slate-600"} />
              <span>{item.shortLabel || item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
