"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Command, Cpu, LayoutDashboard, Workflow } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", icon: Brain, accent: true },
  { href: "/commands", label: "Tareas", icon: Command },
  { href: "/nodes", label: "Equipo", icon: Cpu },
  { href: "/supply", label: "Tienda", icon: Workflow },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-6 lg:hidden">
      <div className="flex items-center justify-around rounded-[32px] border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-2xl">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center gap-1 rounded-2xl px-4 py-3 transition-all",
                active 
                  ? "bg-sky-500/20 text-sky-400 shadow-inner shadow-white/5" 
                  : "text-slate-500 hover:text-slate-200"
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}