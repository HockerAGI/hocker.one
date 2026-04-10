"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Command,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Core", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/commands", label: "Órdenes", icon: Command },
  { href: "/nodes", label: "Nodos", icon: Cpu },
  { href: "/supply", label: "Supply", icon: Workflow },
  { href: "/governance", label: "Guardia", icon: ShieldCheck },
  { href: "/agis", label: "AGIs", icon: Sparkles },
];

export default function AppNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="flex flex-wrap gap-2">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.34em] transition-all",
              active
                ? "border-sky-400/20 bg-sky-400/10 text-sky-200 shadow-[0_0_20px_rgba(14,165,233,0.10)]"
                : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-sky-400/15 hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
