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
    <div className="hko-bottom-dock-wrap">
      <nav className="hko-bottom-dock" aria-label="Navegación inferior">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : ""}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
