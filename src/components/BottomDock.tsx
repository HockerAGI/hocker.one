"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bot, Database, Home, MessageCircle, Shield, Zap } from "lucide-react";

type DockItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
};

const items: DockItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/chat", label: "NOVA", icon: MessageCircle, accent: true },
  { href: "/commands", label: "Acciones", icon: Zap },
  { href: "/nodes", label: "Nodos", icon: Database },
  { href: "/agis", label: "Células", icon: Bot },
  { href: "/governance", label: "Seguridad", icon: Shield },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 px-3 sm:px-5"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 overflow-x-auto rounded-[32px] border border-white/10 bg-slate-950/88 p-2 shadow-[0_22px_90px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative flex min-w-[78px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-center",
                "transition-all duration-300 active:scale-90",
                active ? "text-sky-300" : "text-slate-400 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-0 rounded-2xl blur-xl opacity-0 transition-all duration-500",
                  active
                    ? "bg-sky-500/20 opacity-100"
                    : item.accent
                      ? "bg-sky-500/10 group-hover:opacity-60"
                      : "group-hover:bg-white/5 group-hover:opacity-40",
                ].join(" ")}
              />

              <div
                className={[
                  "relative flex items-center justify-center rounded-xl transition-all duration-300",
                  item.accent
                    ? "h-11 w-11 bg-sky-500 text-black shadow-[0_0_25px_rgba(14,165,233,0.55)] group-hover:scale-110"
                    : "h-9 w-9",
                  active && !item.accent ? "bg-sky-500/10" : "",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 transition-transform duration-300",
                    item.accent ? "text-black" : "group-hover:-translate-y-0.5",
                  ].join(" ")}
                />
              </div>

              <span
                className={[
                  "text-[9px] font-black uppercase tracking-widest leading-none",
                  item.accent ? "text-sky-300" : "",
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
    </nav>
  );
}