"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", icon: Bot },
  { href: "/commands", label: "Ops", icon: TerminalSquare },
  { href: "/nodes", label: "Nodos", icon: Cpu },
  { href: "/governance", label: "Control", icon: ShieldCheck },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-4 pb-safe lg:hidden">
      <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-slate-950/90 p-2 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[20px] px-2 py-3 transition-all",
                  active
                    ? "bg-sky-400/10 text-sky-200"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}