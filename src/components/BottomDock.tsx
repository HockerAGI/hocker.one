"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Command, Cpu, LayoutDashboard, Workflow } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/commands", label: "Tareas", icon: Command },
  { href: "/nodes", label: "Equipo", icon: Cpu },
  { href: "/supply", label: "Tienda", icon: Workflow },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:hidden">
      <nav
        className="mx-auto flex max-w-[680px] items-center justify-around rounded-[30px] border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
        aria-label="Navegación inferior"
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition",
                active
                  ? "bg-sky-400/16 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-slate-500 hover:text-slate-200",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate text-[9px] font-black uppercase tracking-[0.16em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
