"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, CheckSquare, Grid2X2, Home, Menu } from "lucide-react";

const ITEMS = [
  { href: "/owner", label: "Inicio", icon: Home },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/apps", label: "Apps", icon: Grid2X2 },
  { href: "/commands", label: "Tareas", icon: CheckSquare },
  { href: "/dashboard", label: "Más", icon: Menu },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <div className="hko-bottom-dock-wrap">
      <nav className="hko-bottom-dock" aria-label="Navegación principal">
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
