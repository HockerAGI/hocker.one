"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, CheckSquare, Gamepad2, Grid2X2, Home, Layers3, ShieldCheck, Sparkles } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/owner", label: "Inicio", icon: Home },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/apps", label: "Apps", icon: Grid2X2 },
  { href: "/agis", label: "AGIs", icon: Sparkles },
  { href: "/commands", label: "Tareas", icon: CheckSquare },
  { href: "/chido", label: "Chido", icon: Gamepad2 },
  { href: "/security", label: "Seguridad", icon: ShieldCheck },
  { href: "/servicios", label: "Servicios", icon: Layers3 },
];

export default function AppNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Secciones principales">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all",
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
