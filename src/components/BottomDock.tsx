"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, MessageCircle, Shield, Zap, Database } from "lucide-react";

type DockItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 px-3 sm:px-5"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-4xl items-stretch gap-2 overflow-x-auto rounded-[28px] border border-white/10 bg-slate-950/80 p-2 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex min-w-[88px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-center transition-all active:scale-95 ${
                active
                  ? "bg-sky-500/15 text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.12)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 ${
                  active ? "text-sky-300" : "text-current"
                }`}
              />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}