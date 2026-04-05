"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Home,
  MessageCircle,
  Shield,
  "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Database,
  Home,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react";

type DockItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const items: DockItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/chat", label: "NOVA", icon: MessageCircle },
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
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 overflow-x-auto rounded-[32px] border border-white/10 bg-slate-950/85 p-2 shadow-[0_22px_90px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const isNova = item.href === "/chat";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-w-[80px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-center transition-all duration-300 active:scale-90 ${
                active ? "text-sky-300" : "text-slate-400 hover:text-white"
              }`}
            >
              <span
                className={`absolute inset-0 rounded-2xl blur-xl opacity-0 transition-all duration-500 ${
                  active
                    ? "bg-sky-500/20 opacity-100"
                    : isNova
                      ? "bg-sky-500/10 group-hover:opacity-60"
                      : "group-hover:bg-white/5 group-hover:opacity-40"
                }`}
              />

              <div
                className={`relative flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isNova
                    ? "h-12 w-12 bg-sky-500 text-black shadow-[0_0_25px_rgba(14,165,233,0.55)] group-hover:scale-110"
                    : "h-10 w-10"
                } ${active && !isNova ? "bg-sky-500/10" : ""}`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    isNova ? "text-black" : "group-hover:-translate-y-0.5"
                  }`}
                />
              </div>

              <span
                className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                  isNova ? "text-sky-300" : ""
                }`}
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
}";

type DockItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: DockItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/commands", label: "Acciones", icon: Zap },
  { href: "/chat", label: "NOVA", icon: MessageCircle }, // 🔥 centro
  { href: "/nodes", label: "Nodos", icon: Database },
  { href: "/agis", label: "Células", icon: Bot },
  { href: "/governance", label: "Seguridad", icon: Shield },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 px-3 sm:px-5"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 overflow-x-auto rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-2 shadow-[0_20px_80px_rgba(2,6,23,0.6)] backdrop-blur-2xl">

        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const isNova = item.href === "/chat";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-w-[80px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-center transition-all duration-300 active:scale-90 ${
                isNova
                  ? "scale-110"
                  : "scale-100"
              } ${
                active
                  ? "text-sky-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {/* 🔥 Glow dinámico */}
              <span
                className={`absolute inset-0 rounded-2xl blur-xl opacity-0 transition-all duration-500 ${
                  active
                    ? "bg-sky-500/20 opacity-100"
                    : isNova
                    ? "bg-sky-500/10 group-hover:opacity-60"
                    : "group-hover:bg-white/5 group-hover:opacity-40"
                }`}
              />

              {/* 🔥 Botón NOVA destacado */}
              <div
                className={`relative flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isNova
                    ? "h-12 w-12 bg-sky-500 text-black shadow-[0_0_25px_rgba(14,165,233,0.6)] group-hover:scale-110"
                    : "h-10 w-10"
                } ${
                  active && !isNova
                    ? "bg-sky-500/10"
                    : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    isNova
                      ? "text-black"
                      : "group-hover:-translate-y-0.5"
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                  isNova ? "text-sky-300" : ""
                }`}
              >
                {item.label}
              </span>

              {/* Indicador activo */}
              {active && (
                <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-sky-400 shadow-[0_0_10px_#0ea5e9]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}