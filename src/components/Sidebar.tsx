"use client";

import Link from "next/link";
import {
  Bot,
  Command,
  Gauge,
  Grid2X2,
  Network,
  ShieldCheck,
  Store,
} from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Inicio", icon: Grid2X2 },
  { href: "/dashboard", label: "Panel", icon: Gauge },
  { href: "/chat", label: "NOVA", icon: Bot },
  { href: "/commands", label: "Tareas", icon: Command },
  { href: "/nodes", label: "Nodos", icon: Network },
  { href: "/governance", label: "Guardia", icon: ShieldCheck },
  { href: "/supply", label: "Supply", icon: Store },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside
      className="fixed left-4 top-4 z-[95] hidden h-[calc(100dvh-2rem)] w-[258px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/72 p-4 text-white shadow-[0_30px_110px_rgba(0,0,0,0.36)] backdrop-blur-2xl lg:flex"
      aria-label="Menú lateral"
    >
      <Link
        href="/"
        className="flex h-[74px] items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.035]"
        aria-label="Inicio"
      >
        <img
          src="/brand/hocker-one-logo.png"
          alt="Hocker ONE"
          className="max-h-12 w-[170px] object-contain drop-shadow-[0_0_18px_rgba(85,220,255,0.18)]"
        />
      </Link>

      <nav className="mt-5 grid gap-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-h-[52px] items-center gap-3 rounded-2xl border px-4 text-sm font-black tracking-[0.08em] transition",
                active
                  ? "border-sky-300/20 bg-sky-400/12 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-sky-300/20 hover:bg-white/[0.045] hover:text-white",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[26px] border border-emerald-400/15 bg-emerald-400/8 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.30em] text-emerald-200">
          Sistema
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Estados reales. Sin simulación visual.
        </p>
      </div>
    </aside>
  );
}
